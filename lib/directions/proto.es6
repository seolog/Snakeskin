/**
 * Если true, то значит объявляется прототип
 * @type {boolean}
 */
DirObj.prototype.protoStart = false;

/**
 * Кеш "внешних" прототипов
 * @type {!Object}
 */
DirObj.prototype.preProtos = {};

/**
 * Название активного "внешнего" прототипа
 * @type {?string}
 */
DirObj.prototype.protoLink = null;

/**
 * Вернуть строку декларации заданных аргументов прототипа
 *
 * @param {!Array.<!Array>} protoArgs - массив аргументов прототипа [название, значение по умолчанию]
 * @param {!Array} args - массив заданных аргументов
 * @return {string}
 */
DirObj.prototype.returnArgs = function (protoArgs, args) {
	var str = '';

	for (let i = 0; i < protoArgs.length; i++) {
		let val = this.prepareOutput(args[i] || 'null', true);

		let arg = protoArgs[i][0],
			def = protoArgs[i][1];

		str += 'var ' + arg + ' = ' +
			(def !== void 0 ?
				val ?
					'typeof ' + val + ' !== \'undefined\' && ' +
						val + ' !== null ? ' +
						val +
						':' +
						def :
					def :
				val || 'void 0'
			) + ';';

		/*str += `
			var ${arg} = ${def !== void 0 ?
				val ? `${val} != null ? ${val} : ${def} : ${def} : ${val} || void 0`
			};
		`;*/
	}

	return str;
};

Snakeskin.addDirective(
	'proto',

	{
		sys: true,
		notEmpty: true
	},

	function (command, commandLength) {
		var name = command.match(/[^(]+/)[0];

		if (!name) {
			throw this.error('Invalid prototype declaration');
		}

		var parts = name.split('->');

		if (parts[1]) {
			name = parts[1].trim();

			// Идёт декларация внешнего прототипа
			if (!this.tplName) {
				this.tplName = this.pasteDangerBlocks(parts[0]).trim();

				this.preProtos[this.tplName] = this.preProtos[this.tplName] || {
					text: '',
					line: 0
				};

				this.preProtos[this.tplName].startLine = this.info['line'];
				this.protoLink = name;
			}
		}

		if (!name || !this.tplName) {
			throw this.error('Invalid prototype declaration');
		}

		this.startDir(null, {
			name: name,
			startTemplateI: this.i + 1,
			from: this.i - commandLength - 1
		});

		if (this.isAdvTest()) {
			if (protoCache[this.tplName][name]) {
				throw this.error('Proto "' + name + '" is already defined');
			}

			let args = command.match(/\((.*?)\)/),
				argsMap = [];

			if (args) {
				let argsList;

				try {
					argsList = args[1].split(',');

				} catch (ignore) {
					throw this.error('Invalid syntax');
				}

				for (let i = 0; i < argsList.length; i++) {
					let arg = argsList[i].split('=');
					arg[0] = this.declVar(arg[0].trim(), true);
					argsMap.push(arg);
				}
			}

			protoCache[this.tplName][name] = {
				length: commandLength,
				from: this.i - this.startTemplateI + 1,
				argsDecl: args ? args[0] : '',
				args: argsMap,
				calls: {}
			};
		}

		if (!this.parentTplName) {
			this.protoStart = true;
		}
	},

	function (command, commandLength) {
		var tplName = this.tplName,
			lastProto = this.structure.params;

		// Закрылся "внешний" прототип
		if (this.protoLink === lastProto.name) {
			let obj = this.preProtos[this.tplName];

			obj.text += this.source.substring(lastProto.from, this.i + 1);
			obj.line += this.info['line'] - obj.startLine;

			this.protoLink = null;
			this.tplName = null;

			if (!this.hasParentBlock('proto')) {
				this.protoStart = false;
			}

		} else if (!this.protoLink) {
			let proto = protoCache[tplName][lastProto.name];

			if (this.isAdvTest()) {
				proto.to = this.i - this.startTemplateI - commandLength - 1;
				proto.content = this.source
					.substring(this.startTemplateI)
					.substring(proto.from, proto.to);

				fromProtoCache[tplName] = this.i - this.startTemplateI + 1;

				// Рекурсивно анализируем прототипы блоков
				proto.body = Snakeskin.compile(
					'{template ' + tplName + '()}' +
						'{var __I_PROTO__ = 1}' +
						'{__protoWhile__ __I_PROTO__--}' +
							this.source.substring(lastProto.startTemplateI, this.i - commandLength - 1) +
						'{end}' +
					'{end}',

					null,
					null,

					{
						scope: this.scope,
						vars: this.structure.vars,
						proto: {
							name: lastProto.name,
							recursive: lastProto.recursive,
							parentTplName: this.parentTplName,
							pos: this.res.length,
							ctx: this
						}
					}
				);
			}

			// Применение обратных прототипов
			let back = this.backTable[lastProto.name];
			if (back && !back.protoStart) {
				let args = proto.args;
				let fin = true;

				for (let i = 0; i < back.length; i++) {
					let el = back[i];

					if (this.canWrite) {
						if (!el.outer) {
							this.res = this.res.substring(0, el.pos) +
								this.returnArgs(args, el.args) +
								protoCache[tplName][lastProto.name].body +
								this.res.substring(el.pos);

						} else {
							let tmp = this.structure.vars;

							this.structure.vars = el.vars;
							el.argsStr = this.returnArgs(args, el.args);
							this.structure.vars = tmp;

							fin = false;
						}
					}
				}

				if (fin) {
					delete this.backTable[lastProto.name];
					this.backTableI--;
				}
			}
		}

		if ((!this.protoLink || this.protoLink === lastProto.name) && !this.hasParentBlock('proto')) {
			this.protoStart = false;
		}
	}
);

DirObj.prototype.backTable = {
	init: function () {
		return {};
	}
};

/**
 * Количество обратных вызовов прототипа
 * (когда apply до декларации вызываемого прототипа)
 * @type {number}
 */
DirObj.prototype.backTableI = 0;

Snakeskin.addDirective(
	'apply',

	{
		placement: 'template',
		notEmpty: true
	},

	function (command) {
		this.startInlineDir();

		if (this.isSimpleOutput()) {
			let name = /[^(]+/.exec(command)[0],
				args = /\((.*?)\)/.exec(command);

			let cache = protoCache[this.tplName];
			let proto = cache[name],
				argsStr = '';

			if (proto) {
				argsStr = this.returnArgs(proto.args, args ? args[1].split(',') : []);
			}

			let selfProto = this.proto,
				recursive;

			if (selfProto) {
				recursive = proto && proto.calls[selfProto.name];
			}

			// Рекурсивный вызов прототипа
			if (selfProto && selfProto.name === name) {
				this.save(argsStr + this.prepareOutput('__I_PROTO__++', true) + ';');

			// Попытка применить не объявленный прототип
			// (запоминаем место вызова, чтобы вернуться к нему,
			// когда прототип будет объявлен)
			} else if (!proto || !proto.body || recursive) {
				if (!this.backTable[name]) {
					this.backTable[name] = [];
					this.backTable[name].protoStart = this.protoStart;
					this.backTableI++;
				}

				let rand = Math.random() + '';

				this.backTable[name].push({
					proto: selfProto ? cache[selfProto.name] : null,
					pos: this.res.length,

					label: new RegExp('\\/\\* __APPLY__' +
						this.tplName.replace(/([.\[])/g, '\\$1') +
						'_' + name + '_' +
						rand.replace('.', '\\.') + ' \\*\\/'
					),

					args: args,
					recursive: !!proto || !!recursive
				});

				this.save('/* __APPLY__' + this.tplName + '_' + name + '_' + rand + ' */');

				if (selfProto && !proto) {
					cache[selfProto.name].calls[name] = true;
				}

			} else {
				this.save(argsStr + proto.body);
			}
		}
	}
);