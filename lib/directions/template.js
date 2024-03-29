/**
 * Номер итерации,
 * где был декларирован активный шаблон
 * @type {number}
 */
DirObj.prototype.startTemplateI = 0;

/**
 * Номер строки,
 * где был декларирован активный шаблон
 * @type {?number}
 */
DirObj.prototype.startTemplateLine = null;

/**
 * True, если декларируется шаблон-генератор
 * @type {?boolean}
 */
DirObj.prototype.generator = null;

/**
 * Название активного шаблона
 * @type {?string}
 */
DirObj.prototype.tplName = null;

/**
 * Название родительского активного шаблона
 * @type {?string}
 */
DirObj.prototype.parentTplName = null;

/**
 * Массив декларированных констант
 * @type {Array}
 */
DirObj.prototype.consts = null;

/**
 * Название родительского BEM класса
 * @type {string}
 */
DirObj.prototype.bemRef = '';

var template = ['template', 'interface', 'placeholder'];
var scopeModRgxp = new RegExp((("^" + G_MOD) + "+"));

/**
 * Заменить %fileName% в заданной строке на имя активного файла
 *
 * @param {string} str - исходная строка
 * @return {string}
 */
DirObj.prototype.replaceFileName = function (str) {var this$0 = this;
	var file = this.info['file'],
		basename;

	str = this.replaceDangerBlocks(str.replace(/(.?)%fileName%/g, function(sstr, $1)  {
		if (!file) {
			this$0.error('placeholder %fileName% can\'t be used without "file" option');
			return '';
		}

		if (!IS_NODE) {
			this$0.error('placeholder %fileName% can\'t be used with live compilation in browser');
			return '';
		}

		if (!basename) {
			var path = require('path');
			basename = path['basename'](file, path['extname'](file));
		}

		var str = basename;

		if ($1) {
			if ($1 !== '.') {
				str = (("" + $1) + ("'" + str) + "'");

			} else {
				str = $1 + str;
			}
		}

		return str;
	}));

	return str;
};

var nmRgxp = /\.|\[/m,
	nmssRgxp = /^\[/,
	nmsRgxp = /\[/gm,
	nmeRgxp = /]/gm;

/**
 * Подготовить заданную строку декларации имени шаблона
 * (вычисление выражений и т.д.)
 *
 * @param {string} name - исходная строка
 * @return {string}
 */
DirObj.prototype.prepareNameDecl = function (name) {
	name = this.replaceFileName(name);
	if (nmRgxp.test(name)) {
		var tmpArr = name
			.replace(nmssRgxp, '%')
			.replace(nmsRgxp, '.%')
			.replace(nmeRgxp, '')
			.split('.');

		var str = '',
			length = tmpArr.length;

		for (var i = -1; ++i < length;) {
			var el = tmpArr[i],
				custom = el.charAt(0) === '%';

			if (custom) {
				el = el.substring(1);
			}

			if (custom) {
				str += (("['" + (this.evalStr(("return " + (this.pasteDangerBlocks(this.prepareOutput(el, true))))))) + "']");
				continue;
			}

			str += str ? ("." + el) : el;
		}

		name = str;
	}

	return name.trim();
};

function concatProp(str) {
	return str.charAt(0) === '[' ? str : ("." + str);
}

for (var i = -1; ++i < template.length;) {
	Snakeskin.addDirective(
		template[i],

		{
			block: true,
			placement: 'global',
			notEmpty: true,
			group: [
				'template',
				'rootTemplate',
				'define'
			]
		},

		function (command, commandLength, type, jsDoc) {
			this.startDir(type === 'template' && this.interface ? 'interface' : null);

			this.startTemplateI = this.i + 1;
			this.startTemplateLine = this.info['line'];

			var nameRgxp = /^[^a-z_$[]/i,
				esprimaNameHackRgxp = new RegExp((("[" + (G_MOD + L_MOD)) + "]"), 'g');

			var tmpTplName = this.getFnName(command),
				tplName = this.pasteDangerBlocks(tmpTplName);

			var iface =
				this.name === 'interface';

			var lastName = null,
				proto = this.proto;

			if (!proto) {
				tmpTplName = this.replaceFileName(tmpTplName);

				var prfx = '',
					pos;

				if (/\*/.test(tmpTplName)) {
					prfx = '*';
					tmpTplName = tmpTplName.replace(prfx, '');
				}

				tplName = this.pasteDangerBlocks(tmpTplName);
				this.generator = Boolean(prfx);

				try {
					if (!tplName || nameRgxp.test(tplName)) {
						throw false;
					}

					esprima.parse(tplName.replace(esprimaNameHackRgxp, ''));

				} catch (ignore) {
					return this.error((("invalid \"" + (this.name)) + "\" name"));
				}

				if (tplName === 'init') {
					return this.error((("can't declare template \"" + tplName) + "\", try another name"));
				}

				this.info['template'] =
					this.tplName = tplName;

				if (this.name !== 'template' && !write[tplName]) {
					write[tplName] = false;
				}

				// Для возможности удобного пост-парсинга,
				// каждая функция снабжается комментарием вида:
				// /* Snakeskin template: название шаблона; параметры через запятую */
				this.save(
					(pos = (("/* Snakeskin template: " + tplName) + ("; " + (this.getFnArgs(command).join(',').replace(/=(.*?)(?:,|$)/g, ''))) + " */")),
					iface,
					jsDoc
				);

				if (jsDoc) {
					jsDoc += pos.length;
				}

				// Декларация функции
				// с пространством имён или при экспорте в common.js
				if (nmRgxp.test(tmpTplName) || this.commonJS) {
					lastName = '';
					var tmpArr = tmpTplName
						.replace(nmssRgxp, '%')
						.replace(nmsRgxp, '.%')
						.replace(nmeRgxp, '')
						.split('.');

					var str = tmpArr[0],
						length = tmpArr.length,
						first = str.charAt(0);

					if (first === '%') {
						str = (("['" + (this.evalStr(("return " + (this.pasteDangerBlocks(this.prepareOutput(str.substring(1), true))))))) + "']");
					}

					for (var i = 0; ++i < length;) {
						var el = tmpArr[i],
							custom = el.charAt(0) === '%';

						if (custom) {
							el = el.substring(1);
						}

						var def = ("this" + (concatProp(str)));

						this.save(
							(pos = (("\
\n								if (" + def) + (" == null) {\
\n									" + def) + " = {};\
\n								}\
\n							")),

							iface,
							jsDoc
						);

						if (jsDoc) {
							jsDoc += pos.length;
						}

						if (custom) {
							str += (("['" + (this.evalStr(("return " + (this.pasteDangerBlocks(this.prepareOutput(el, true))))))) + "']");
							continue;

						} else if (i === length - 1) {
							lastName = el;
						}

						str += ("." + el);
					}

					tplName = str;
				}

				this.save((("this" + (concatProp(tplName))) + (" = function " + prfx) + ("" + (lastName !== null ? lastName : tplName)) + "("), iface);
			}

			this.info['template'] =
				this.tplName = tplName;

			this.blockStructure = {
				name: 'root',
				parent: null,
				children: []
			};

			this.blockTable = {};
			this.varCache[tplName] = {};

			if (proto) {
				this.superStrongSpace = proto.superStrongSpace;
				this.strongSpace = proto.strongSpace;
				this.space = proto.space;
				return;
			}

			// Валидация шаблона для наследования
			var parentTplName;
			if (/\bextends\b/m.test(command)) {
				try {
					parentTplName = /\s+extends\s+(.*)/m.exec(command)[1];
					this.parentTplName = parentTplName;

					if (!parentTplName || nameRgxp.test(parentTplName)) {
						throw false;
					}

					esprima.parse(parentTplName.replace(esprimaNameHackRgxp, ''));

				} catch (ignore) {
					return this.error((("invalid \"" + (this.name)) + "\" name for extend"));
				}

				parentTplName = this.prepareNameDecl(parentTplName);
				if (cache[parentTplName] == null) {
					if (!this.interface) {
						return this.error((("the specified template \"" + parentTplName) + "\" for inheritance is not defined"));
					}

					parentTplName =
						this.parentTplName = null;
				}
			}

			this.initTemplateCache(tplName);

			argsCache[tplName] = {};
			argsResCache[tplName] = {};

			outputCache[tplName] = {};
			extMap[tplName] = parentTplName;

			var args = this.prepareArgs(command, 'template', tplName, parentTplName);
			this.save((("" + (args.str)) + ") {"), iface);

			if (args.scope) {
				this.scope.push(args.scope);
			}

			var predefs = ['callee', 'blocks', '$_', 'TPL_NAME', 'PARENT_TPL_NAME'];

			for (var i$0 = -1; ++i$0 < predefs.length;) {
				this.structure.vars[predefs[i$0]] = {
					value: predefs[i$0],
					scope: 0
				};
			}

			this.save((("\
\n				var __THIS__ = this,\
\n					callee = __ROOT__" + (concatProp(tplName))) + (";\
\n\
\n				if (!callee.Blocks) {\
\n					var __BLOCKS__ = callee.Blocks = {},\
\n						blocks = __BLOCKS__;\
\n				}\
\n\
\n				var __RESULT__ = " + (this.declResult())) + (",\
\n					$_;\
\n\
\n				function getTplResult() {\
\n					return " + (this.returnResult())) + (";\
\n				}\
\n\
\n				var __RETURN__ = false,\
\n					__RETURN_VAL__;\
\n\
\n				var TPL_NAME = '" + (applyDefEscape(tplName))) + ("',\
\n					PARENT_TPL_NAME" + (parentTplName ? ((" = '" + (applyDefEscape(this.pasteDangerBlocks(parentTplName)))) + "'") : '')) + (";\
\n\
\n				" + (args.defParams)) + "\
\n			"));

			var preProtos = this.preProtos[tplName];

			// Подкючение "внешних" прототипов
			if ((!extMap[tplName] || parentTplName) && preProtos) {
				this.source = this.source.substring(0, this.i + 1) +
					preProtos.text +
					this.source.substring(this.i + 1);

				delete this.preProtos[tplName];
			}
		},

		function (command, commandLength) {
			var tplName = String(this.tplName),
				proto = this.proto;

			if (proto) {
				// Вызовы не объявленных прототипов внутри прототипа
				if (this.backTableI) {
					var cache$0 = Object(this.backTable),
						ctx = proto.ctx;

					ctx.backTableI += this.backTableI;
					for (var key in cache$0) {
						if (!cache$0.hasOwnProperty(key)) {
							continue;
						}

						for (var i = -1; ++i < cache$0[key].length;) {
							var el = cache$0[key][i];
							el.pos += proto.pos;
							el.outer = true;
							el.vars = this.structure.vars;
						}

						ctx.backTable[key] = ctx.backTable[key] ?
							ctx.backTable[key].concat(cache$0[key]) : cache$0[key];
					}
				}

				return;
			}

			var diff = this.getDiff(commandLength);

			cache[tplName] = this.source.substring(this.startTemplateI, this.i - diff);
			table[tplName] = this.blockTable;

			// Обработка наследования:
			// тело шаблона объединяется с телом родителя
			// и обработка шаблона начинается заново,
			// но уже как атомарного (без наследования)
			if (this.parentTplName) {
				this.info['line'] = this.startTemplateLine;
				this.lines.splice(this.startTemplateLine, this.lines.length);

				this.source = this.source.substring(0, this.startTemplateI) +
					this.getFullBody(tplName) +
					this.source.substring(this.i - diff);

				this.initTemplateCache(tplName);
				this.startDir(this.structure.name);

				this.i = this.startTemplateI - 1;
				this.parentTplName = null;

				this.blockTable = {};
				this.varCache[tplName] = {};

				return;
			}

			// Вызовы не объявленных прототипов
			if (this.backTableI) {
				var cache$1 = Object(this.backTable);

				for (var key$0 in cache$1) {
					if (!cache$1.hasOwnProperty(key$0)) {
						continue;
					}

					for (var i$1 = -1; ++i$1 < cache$1[key$0].length;) {
						var el$0 = cache$1[key$0][i$1];

						if (!el$0.outer) {
							continue;
						}

						var tmp = protoCache[tplName][key$0];
						if (!tmp) {
							return this.error((("proto \"" + key$0) + "\" is not defined"));
						}

						this.res = this.res.substring(0, el$0.pos) +
							this.res.substring(el$0.pos).replace(
								el$0.label,
									(el$0.argsStr || '') + (el$0.recursive ? tmp.i + '++;' : tmp.body)
							);
					}
				}

				this.backTable = {};
			}

			var iface = this.structure.name === 'interface';

			if (iface) {
				this.save('};', true);

			} else {
				this.save((("\
\n						" + (this.consts.join(''))) + ("\
\n						return " + (this.returnResult())) + (";\
\n					};\
\n\
\n					Snakeskin.cache['" + (applyDefEscape(this.pasteDangerBlocks(tplName)))) + ("'] = this" + (concatProp(tplName))) + ";\
\n				"));
			}

			this.save('/* Snakeskin template. */', iface);

			this.canWrite = true;
			this.tplName = null;

			delete this.info['template'];

			if (this.scope.length) {
				this.scope.pop();
			}
		}
	);
}