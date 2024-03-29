/**
 * Если true, то значит идёт декларация прототипа
 * @type {boolean}
 */
DirObj.prototype.protoStart = false;

/**
 * Кеш внешних прототипов
 * @type {!Object}
 */
DirObj.prototype.preProtos = {};

/**
 * Название активного внешнего прототипа
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
DirObj.prototype.returnProtoArgs = function (protoArgs, args) {
	var str = '';

	for (let i = -1; ++i < protoArgs.length;) {
		let val = this.prepareOutput(args[i] || 'void 0', true);

		let arg = protoArgs[i][0],
			def = protoArgs[i][1];

		if (def !== void 0) {
			def = this.prepareOutput(def, true);
		}

		arg = arg.replace(scopeModRgxp, '');

		str += `
			var ${arg} = ${def !== void 0 ?
				val ? `${val} != null ? ${val} : ${this.prepareOutput(def, true)}` : def : val || 'void 0'
			};
		`;
	}

	return str;
};

Snakeskin.addDirective(
	'proto',

	{
		sys: true,
		block: true,
		notEmpty: true,
		group: [
			'template',
			'define',
			'inherit',
			'blockInherit'
		]
	},

	function (command, commandLength) {
		var name = this.getFnName(command),
			tplName = this.tplName;

		if (!name) {
			return this.error(`invalid "${this.name}" name`);
		}

		var parts = name.split('->');

		if (parts[1]) {
			name = parts[1].trim();

			// Идёт декларация внешнего прототипа
			if (!tplName) {
				if (this.structure.parent) {
					this.error(`directive "outer proto" can be used only within the global space`);
					return;
				}

				tplName =
					this.tplName = this.prepareNameDecl(parts[0]);

				this.preProtos[tplName] = this.preProtos[tplName] || {
					text: ''
				};

				this.preProtos[tplName].startLine = this.info['line'];
				this.protoLink = name;
			}
		}

		if (!name || !tplName || blockNameRgxp.test(name)) {
			return this.error(`invalid "${this.name}" declaration`);
		}

		var start = this.i - this.startTemplateI;
		this.startDir(null, {
			name: name,
			startTemplateI: this.i + 1,
			from: this.i - this.getDiff(commandLength),
			fromBody: start + 1,
			line: this.info['line']
		});

		if (this.isAdvTest()) {
			let dir = String(this.name);

			if (protoCache[tplName][name]) {
				return this.error(`proto "${name}" is already defined`);
			}

			let output = command.split('=>')[1],
				ouptupCache = this.getBlockOutput(dir);

			if (output != null) {
				ouptupCache[name] = output;
			}

			let args = this.prepareArgs(
				command,
				dir,
				null,
				this.parentTplName,
				name
			);

			protoCache[tplName][name] = {
				length: commandLength,
				from: start - this.getDiff(commandLength),

				args: args.list,
				scope: args.scope,

				calls: {},
				needPrfx: this.needPrfx,

				output: output
			};
		}

		if (!this.parentTplName) {
			this.protoStart = true;
		}
	},

	function (command, commandLength) {
		var tplName = this.tplName,
			struct = this.structure;

		var vars = struct.vars,
			params = struct.params;

		var proto;
		var s = (this.needPrfx ? ADV_LEFT_BLOCK : '') + LEFT_BLOCK,
			e = RIGHT_BLOCK;

		// Закрылся "внешний" прототип
		if (this.protoLink === params.name) {
			let obj = this.preProtos[tplName];

			obj.text += `
				${s}__switchLine__ ${obj.startLine}${e}
					${this.source.substring(params.from, this.i + 1)}
				${s}end${e}
			`;

			this.protoLink = null;
			this.tplName = null;

			if (!this.hasParentBlock('proto')) {
				this.protoStart = false;
			}

		} else if (!this.protoLink) {
			proto = protoCache[tplName][params.name];
			let start = this.i - this.startTemplateI;

			if (this.isAdvTest()) {
				let diff = this.getDiff(commandLength),
					scope = proto.scope;

				proto.to = start + 1;
				proto.content = this.source
					.substring(this.startTemplateI)
					.substring(params.fromBody, start - diff);

				fromProtoCache[tplName] = this.i - this.startTemplateI + 1;

				// Рекурсивно анализируем прототипы блоков
				proto.body = Snakeskin.compile(
					`
						${s}template ${tplName}()${e}
							${scope ? `${s}with ${scope}${e}` : ''}

								${s}var __I_PROTO__ = 1${e}
								${s}__protoWhile__ __I_PROTO__--${e}
									${s}__setLine__ ${params.line}${e}
									${this.source.substring(params.startTemplateI, this.i - diff)}
								${s}end${e}

							${scope ? `${s}end${e}` : ''}
						${s}end${e}
					`.trim(),

					{
						inlineIterators: this.inlineIterators,
						stringBuffer: this.stringBuffer,
						escapeOutput: this.escapeOutput,
						xml: this.xml
					},

					null,

					{
						parent: this,
						lines: this.lines.slice(),

						needPrfx: this.needPrfx,
						prfxI: this.prfxI,

						scope: this.scope.slice(),
						vars: struct.vars,
						consts: this.consts,

						proto: {
							name: params.name,
							recursive: params.recursive,
							parentTplName: this.parentTplName,

							pos: this.res.length,
							ctx: this,

							superStrongSpace: this.superStrongSpace,
							strongSpace: this.strongSpace,
							space: this.space
						}
					}
				);
			}

			// Применение обратных прототипов
			let back = this.backTable[params.name];
			if (back && !back.protoStart) {
				let args = proto.args,
					fin = true;

				for (let i = -1; ++i < back.length;) {
					let el = back[i];

					if (this.canWrite) {
						if (!el.outer) {
							this.res = this.res.substring(0, el.pos) +
								this.returnProtoArgs(args, el.args) +
								protoCache[tplName][params.name].body +
								this.res.substring(el.pos);

						} else {
							struct.vars = el.vars;
							el.argsStr = this.returnProtoArgs(args, el.args);
							struct.vars = vars;
							fin = false;
						}
					}
				}

				if (fin) {
					delete this.backTable[params.name];
					this.backTableI--;
				}
			}

			if (this.protoStart && !this.protoLink && !this.hasParentBlock('proto')) {
				this.protoStart = false;
			}

			if (proto) {
				let ouptupCache = this.getBlockOutput('proto');
				if (ouptupCache[params.name] != null && this.isSimpleOutput()) {
					struct.vars = struct.parent.vars;

					this.save(
							this.returnProtoArgs(
								proto.args,
								this.getFnArgs(`(${ouptupCache[params.name]})`)
							) +

							proto.body
					);

					struct.vars = vars;
				}
			}
		}
	}
);

/**
 * Таблица обратных вызовов прототипа
 */
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
		notEmpty: true,
		text: true
	},

	function (command) {
		this.startInlineDir();
		if (this.isSimpleOutput()) {
			let tplName = this.tplName;
			let name = this.getFnName(command),
				args = this.getFnArgs(command);

			let cache = protoCache[tplName];
			let proto = cache[name],
				argsStr = '';

			if (proto) {
				argsStr = this.returnProtoArgs(proto.args, args);
			}

			let selfProto = this.proto;
			if (selfProto && proto && proto.calls[selfProto.name]) {
				return this.error(`invalid form of recursion for the proto (apply "${name}" inside "${selfProto.name}")`);
			}

			// Рекурсивный вызов прототипа
			if (selfProto && selfProto.name === name) {
				this.save(argsStr + this.prepareOutput('__I_PROTO__++', true) + ';');

			// Попытка применить не объявленный прототип
			// (запоминаем место вызова, чтобы вернуться к нему,
			// когда прототип будет объявлен)
			} else if (!proto || !proto.body) {
				let back = this.backTable;

				if (!back[name]) {
					back[name] = [];
					back[name].protoStart = this.protoStart;
					this.backTableI++;
				}

				let rand = Math.random().toString(),
					key = `${tplName.replace(/([.\[])/g, '\\$1')}_${name}_${rand.replace('.', '\\.')}`;

				back[name].push({
					proto: selfProto ?
						cache[selfProto.name] : null,

					pos: this.res.length,
					label: new RegExp(`\\/\\* __APPLY__${key} \\*\\/`),

					args: args,
					recursive: Boolean(proto)
				});

				this.save(`/* __APPLY__${tplName}_${name}_${rand} */`);

				if (selfProto && !proto) {
					cache[selfProto.name].calls[name] = true;
				}

			} else {
				this.save(argsStr + proto.body);
			}
		}
	}
);