/*!
 * Директива template
 */

/**
 * Номер итерации объявления шаблона
 * @type {number}
 */
DirObj.prototype.startI = 0;

/**
 * Количество открытых блоков
 * @type {number}
 */
DirObj.prototype.openBlockI = 0;

/**
 * Название шаблона
 * @type {?string}
 */
DirObj.prototype.tplName = null;

/**
 * Название родительского шаблона
 * @type {?string}
 */
DirObj.prototype.parentTplName = null;

/**
 * Кеш объявленных пространств имён
 */
DirObj.prototype.nmCache = {
	init: function () {
		return {};
	}
};

/**
 * Декларация шаблона
 *
 * @param {string} command - название команды (или сама команда)
 * @param {number} commandLength - длина команды
 *
 * @param {!DirObj} dirObj - объект управления директивами
 * @param {!Object} adv - дополнительные параметры
 * @param {boolean} adv.commonJS - true, если шаблон генерируется в формате commonJS
 * @param {boolean} adv.dryRun - true, если холостая обработка
 * @param {!Object} adv.info - информация о шаблоне (название файлы, узла и т.д.)
 */
Snakeskin.Directions['template'] = function (command, commandLength, dirObj, adv) {
	// Начальная позиция шаблона
	// +1 => } >>
	dirObj.startI = dirObj.i + 1;

	// Имя + пространство имён шаблона
	var tmpTplName = /(.*?)\(/.exec(command)[1],
		tplName = Snakeskin.pasteDangerBlocks(tmpTplName, dirObj.quotContent);

	dirObj.tplName = tplName;

	// Если количество открытых блоков не совпадает с количеством закрытых,
	// то кидаем исключение
	if (dirObj.openBlockI !== 0) {
		throw Snakeskin.error(
			'Missing closing or opening tag in the template ' +
			'(command: {' + command + '}, template: "' + tplName + ', ' + Snakeskin.genErrorAdvInfo(adv.info) + '")!'
		);
	}
	dirObj.openBlockI++;

	if (adv.dryRun) {
		return;
	}

	// Название родительского шаблона
	var parentTplName;
	if (/\s+extends\s+/.test(command)) {
		parentTplName = Snakeskin.pasteDangerBlocks(/\s+extends\s+(.*)/.exec(command)[1], dirObj.quotContent);
		dirObj.parentTplName = parentTplName;
	}

	blockCache[tplName] = {};
	protoCache[tplName] = {};
	fromProtoCache[tplName] = 0;

	varCache[tplName] = {};
	fromVarCache[tplName] = 0;
	varICache[tplName] = {};

	extMap[tplName] = parentTplName;

	// Входные параметры
	var params = /\((.*?)\)/.exec(command)[1];

	// Для возможности удобного пост-парсинга,
	// каждая функция снабжается комментарием вида:
	// /* Snakeskin template: название шаблона; параметры через запятую */
	dirObj.save('/* Snakeskin template: ' + tplName + '; ' + params.replace(/=(.*?)(?:,|$)/g, '') + ' */');

	// Декларация функции
	// с пространством имён или при экспорте в common.js
	if (/\.|\[/.test(tmpTplName) || adv.commonJS) {
		tmpTplName
			// Заменяем [] на .
			.replace(/\[/g, '.')
			.replace(/]/g, '')

			.split('.').reduce(function (str, el, i) {
				// Проверка существования пространства имён
				if (!dirObj.nmCache[str]) {
					dirObj.save('' +
						'if (typeof ' + (adv.commonJS ? 'exports.' : '') + str + ' === \'undefined\') { ' +
						(adv.commonJS ? 'exports.' : i === 1 ? require ? 'var ' : 'window.' : '') + str + ' = {}; }'
					);

					dirObj.nmCache[str] = true;
				}

				if (el.substring(0, 18) === '__SNAKESKIN_QUOT__') {
					return str + '[' + el + ']';
				}

				return str + '.' + el;
			});

		dirObj.save((adv.commonJS ? 'exports.' : '') + tmpTplName + '= function (');

	// Без простраства имён
	} else {
		dirObj.save((!require ? 'window.' + tmpTplName + ' = ': '') + 'function ' + (require ? tmpTplName : '') + '(');
	}

	// Входные параметры
	params = params.split(',');
	// Если шаблон наследуется,
	// то подмешиваем ко входым параметрам шаблона
	// входные параметры родителя
	paramsCache[tplName] = paramsCache[parentTplName] ? paramsCache[parentTplName].concat(params) : params;

	// Переинициализация входных параметров родительскими
	// (только если нужно)
	if (paramsCache[parentTplName]) {
		Snakeskin.forEach(paramsCache[parentTplName], function (el) {
			var def = el.split('=');
			// Здесь и далее по коду
			// [0] - название переменной
			// [1] - значение по умолчанию (опционально)
			def[0] = def[0].trim();
			def[1] = def[1] && def[1].trim();

			Snakeskin.forEach(params, function (el2, i) {
				var def2 = el2.split('=');
				def2[0] = def2[0].trim();
				def2[1] = def2[1] && def2[1].trim();

				// Если переменная не имеет параметра по умолчанию,
				// то ставим параметр по умолчанию родителя
				if (def[0] === def2[0] && typeof def2[1] === 'undefined') {
					params[i] = el;
				}
			});
		});
	}

	// Инициализация параметров по умолчанию
	// (эээххх, когда же настанет ECMAScript 6 :()
	var defParams = '';
	Snakeskin.forEach(params, function (el, i) {
		var def = el.split('=');
		def[0] = def[0].trim();
		dirObj.save(def[0]);

		if (def.length > 1) {
			// Подмешивание родительских входных параметров
			if (paramsCache[parentTplName] && !defParams) {
				Snakeskin.forEach(paramsCache[parentTplName], function (el) {
					var def = el.split('='),
						local;

					def[0] = def[0].trim();
					def[1] = def[1] && def[1].trim();

					// true, если входной параметр родительского шаблона
					// присутствует также в дочернем
					Snakeskin.forEach(params, function (el) {
						var val = el.split('=');
						val[0] = val[0].trim();
						val[1] = val[1] && val[1].trim();

						if (val[0] === def[0]) {
							local = true;
							return false;
						}

						return true;
					});

					// Если входный параметр родителя отсутствует у ребёнка,
					// то инициализируем его как локальную переменную шаблона
					if (!local) {
						// С параметром по умолчанию
						if (typeof def[1] !== 'undefined') {
							defParams += 'var ' + def[0] + ' = ' + def[1] + ';';
							varICache[tplName][def[0]] = el;
						}
					}
				});
			}

			// Параметры по умолчанию
			def[1] = def[1].trim();
			defParams += def[0] + ' = typeof ' + def[0] + ' !== \'undefined\' && ' +
				def[0] + ' !== null ? ' + def[0] + ' : ' + def[1] + ';';
		}

		// Кеширование
		varICache[tplName][def[0]] = el;

		// После последнего параметра запятая не ставится
		if (i !== params.length - 1) {
			dirObj.save(',');
		}
	});

	dirObj.save(') { ' + defParams + 'var __SNAKESKIN_RESULT__ = \'\';');
	dirObj.save('var TPL_NAME = \'' + tmpTplName + '\';');

	if (parentTplName) {
		dirObj.save('var PARENT_TPL_NAME = \'' + parentTplName + '\';');
	}
};

/**
 * Директива end для template
 *
 * @param {string} command - название команды (или сама команда)
 * @param {number} commandLength - длина команды
 *
 * @param {!DirObj} dirObj - объект управления директивами
 * @param {!Object} adv - дополнительные параметры
 * @param {boolean} adv.commonJS - true, если шаблон генерируется в формате commonJS
 * @param {boolean} adv.dryRun - true, если холостая обработка
 * @param {!Object} adv.info - информация о шаблоне (название файлы, узла и т.д.)
 * @return {?}
 */
Snakeskin.Directions.templateEnd = function (command, commandLength, dirObj, adv) {
	var tplName = dirObj.tplName;

	// Вызовы не объявленных прототипов
	if (dirObj.backHashI) {
		throw Snakeskin.error(
			'Proto "' + dirObj.lastBack + '" is not defined ' +
			'(command: {' + command + '}, template: "' + tplName + ', ' + Snakeskin.genErrorAdvInfo(adv.info) + '")!'
		);
	}

	if (adv.dryRun) {
		return;
	}

	var source = dirObj.source,
		i = dirObj.i,
		startI = dirObj.startI;

	// Кешируем тело шаблона
	cache[tplName] = source.substring(startI, i - commandLength - 1);

	// Обработка наследования:
	// тело шаблона объединяется с телом родителя
	// и обработка шаблона начинается заново,
	// но уже как атомарного (без наследования)
	var parentName = dirObj.parentTplName;
	if (parentName) {
		// Результирующее тело шаблона
		dirObj.source = source.substring(0, startI) +
			Snakeskin.getExtStr(tplName, adv.info) +
			source.substring(i - commandLength - 1);

		// Перемотка переменных
		// (сбрасывание)
		blockCache[tplName] = {};

		protoCache[tplName] = {};
		fromProtoCache[tplName] = 0;

		varCache[tplName] = {};
		fromVarCache[tplName] = 0;
		varICache[tplName] = {};

		dirObj.i = startI - 1;
		dirObj.openBlockI++;

		if (Snakeskin.write[parentName] === false) {
			dirObj.res = dirObj.res.replace(new RegExp('/\\* Snakeskin template: ' +
					parentName.replace(/([.\[\]^$])/g, '\\$1') +
					';[\\s\\S]*?/\\* Snakeskin template\\. \\*/', 'm'),
				'');
		}

		dirObj.parentTplName = null;
		return false;
	}

	dirObj.save(
			'return __SNAKESKIN_RESULT__; };' +
		'if (typeof Snakeskin !== \'undefined\') {' +
			'Snakeskin.cache[\'' +
				Snakeskin.pasteDangerBlocks(tplName, dirObj.quotContent).replace(/'/g, '\\\'') +
			'\'] = ' + (adv.commonJS ? 'exports.' : '') + tplName + ';' +
		'}/* Snakeskin template. */'
	);

	dirObj.canWrite = true;
	dirObj.tplName = null;
};