/*!
 * Snakeskin v4.0.20 (live)
 * https://github.com/kobezzza/Snakeskin
 *
 * Released under the MIT license
 * https://github.com/kobezzza/Snakeskin/blob/master/LICENSE
 *
 * Date: Tue, 19 Aug 2014 07:26:45 GMT
 */

Array.isArray = Array.isArray || function (obj) {
	return ({}).toString.call(obj) === '[object Array]';
};

String.prototype.trim = String.prototype.trim || function () {
	var str = this.replace(/^\s\s*/, ''),
		i = str.length;

	for (var rgxp = /\s/; rgxp.test(str.charAt(--i));) {}
	return str.substring(0, i + 1);
};
/** @type {!Object} */
var Snakeskin = {
	/**
	 * Версия Snakeskin
	 *
	 * @expose
	 * @type {!Array}
	 */
	VERSION: [4, 0, 20],

	/**
	 * Пространство имён для директив
	 * @type {!Object}
	 */
	Directions: {},

	/**
	 * Пространство имён для фильтров
	 *
	 * @expose
	 * @type {!Object}
	 */
	Filters: {},

	/**
	 * Пространство имён для суперглобальных переменных
	 *
	 * @expose
	 * @type {!Object}
	 */
	Vars: {},

	/**
	 * Пространство имён для локальных переменных
	 * области декларации шаблонов
	 *
	 * @expose
	 * @type {!Object}
	 */
	LocalVars: {},

	/**
	 * Кеш шаблонов
	 *
	 * @expose
	 * @type {!Object}
	 */
	cache: {}
};

(function () {
	var IS_NODE = typeof window === 'undefined' &&
		typeof exports !== 'undefined';

	var root = this;

/**
 * Импортировать свойства заданного объекта в пространство имён Snakeskin.Filters
 *
 * @expose
 * @param {!Object} filters - импортируемый объект
 * @param {?string=} [opt_namespace] - пространство имён для сохранения, например, foo.bar
 */
Snakeskin.importFilters = function (filters, opt_namespace) {
	var obj = Snakeskin.Filters;

	if (opt_namespace) {
		var parts = opt_namespace.split('.');
		for (var i = -1; ++i < parts.length;) {
			if (!obj[parts[i]]) {
				obj[parts[i]] = {};
			}

			obj = obj[parts[i]];
		}
	}

	for (var key in filters) {
		if (!filters.hasOwnProperty(key)) {
			continue;
		}

		obj[key] = filters[key];
	}
};

var entityMap = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	'\'': '&#39;',
	'/': '&#x2F;'
};

var escapeHTMLRgxp = /[&<>"'\/]/g,
	escapeAttrRgxp = /([$\w]\s*=\s*)([^"'\s>=]+)/g,
	escapeJavaScript = /(javascript)(:|;)/,
	escapeHTML = function(s)  {return entityMap[s]};

/**
 * Экранирование HTML сущностей
 *
 * @expose
 * @param {*} str - исходная строка
 * @param {?boolean=} [opt_attr=false] - если true, то дополнительное экранируются xml атрибуты
 * @return {string}
 */
Snakeskin.Filters.html = function (str, opt_attr) {
	var res = ((str) + '');

	if (opt_attr) {
		res = res.replace(escapeAttrRgxp, '$1"$2"');
	}

	res = res.replace(escapeHTMLRgxp, escapeHTML);

	if (opt_attr) {
		res = res.replace(escapeJavaScript, '$1&#31;$2');
	}

	return res;
};

/**
 * Замена undefined на ''
 *
 * @expose
 * @param {*} str - исходная строка
 * @return {*}
 */
Snakeskin.Filters.undef = function (str) {
	return str !== void 0 ? str : '';
};

var uentityMap = {
	'&amp;': '&',
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&#39;': '\'',
	'&#x2F;': '/'
};

var uescapeHTMLRgxp = /&amp;|&lt;|&gt;|&quot;|&#39;|&#x2F;/g,
	uescapeHTML = function(s)  {return uentityMap[s]};

/**
 * Снятие экранирования HTML сущностей
 *
 * @param {*} str - исходная строка
 * @return {string}
 */
Snakeskin.Filters['uhtml'] = function (str) {
	return ((str) + '').replace(uescapeHTMLRgxp, uescapeHTML);
};

var stripTagsRgxp = /<\/?[^>]+>/g;

/**
 * Удаление HTML тегов
 *
 * @param {*} str - исходная строка
 * @return {string}
 */
Snakeskin.Filters['stripTags'] = function (str) {
	return ((str) + '').replace(stripTagsRgxp, '');
};

var uriO = /%5B/g,
	uriC = /%5D/g;

/**
 * Кодирование URL
 *
 * @see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/encodeURI
 * @param {*} str - исходная строка
 * @return {string}
 */
Snakeskin.Filters['uri'] = function (str) {
	return encodeURI(((str) + ''))
		.replace(uriO, '[')
		.replace(uriC, ']');
};

/**
 * Перевод строки в верхний регистр
 *
 * @param {*} str - исходная строка
 * @return {string}
 */
Snakeskin.Filters['upper'] = function (str) {
	return ((str) + '').toUpperCase();
};

/**
 * Перевод первой буквы строки в верхний регистр
 *
 * @param {*} str - исходная строка
 * @return {string}
 */
Snakeskin.Filters['ucfirst'] = function (str) {
	str = ((str) + '');
	return str.charAt(0).toUpperCase() + str.substring(1);
};

/**
 * Перевод строки в нижний регистр
 *
 * @param {*} str - исходная строка
 * @return {string}
 */
Snakeskin.Filters['lower'] = function (str) {
	return ((str) + '').toLowerCase();
};

/**
 * Перевод первой буквы строки в нижний регистр
 *
 * @param {*} str - исходная строка
 * @return {string}
 */
Snakeskin.Filters['lcfirst'] = function (str) {
	str = ((str) + '');
	return str.charAt(0).toLowerCase() + str.substring(1);
};

/**
 * Срез крайних пробелов строки
 *
 * @param {*} str - исходная строка
 * @return {string}
 */
Snakeskin.Filters['trim'] = function (str) {
	return ((str) + '').trim();
};

var spaceCollapseRgxp = /\s{2,}/g;

/**
 * Срез крайних пробелов строки
 * и свёртывание остальных пробелов в один
 *
 * @param {*} str - исходная строка
 * @return {string}
 */
Snakeskin.Filters['collapse'] = function (str) {
	return ((str) + '').replace(spaceCollapseRgxp, ' ').trim();
};

/**
 * Обрезание строки до заданной длины
 * (в конце, если нужно, ставится многоточие)
 *
 * @param {*} str - исходная строка
 * @param {number} length - максимальная длина текста
 * @param {?boolean=} [opt_wordOnly=false] - если false, то текст обрезается без учёта целостности слов
 * @return {string}
 */
Snakeskin.Filters['truncate'] = function (str, length, opt_wordOnly) {
	str = ((str) + '');
	if (!str || str.length <= length) {
		return str;
	}

	var tmp = str.substring(0, length - 1),
		lastInd = void 0;

	var i = tmp.length;
	while (i-- && opt_wordOnly) {
		if (tmp.charAt(i) === ' ') {
			lastInd = i;

		} else if (lastInd !== void 0) {
			break;
		}
	}

	return (lastInd !== void 0 ? tmp.substring(0, lastInd) : tmp) + '…';
};

/**
 * Генерация строки из повторений исходной подстроки
 *
 * @param {*} str - исходная строка
 * @param {?number=} [opt_num=2] - число повторений
 * @return {string}
 */
Snakeskin.Filters['repeat'] = function (str, opt_num) {
	return new Array(opt_num != null ? opt_num + 1 : 3).join(str);
};

/**
 * Удаление подстроки из строки
 *
 * @param {*} str - исходная строка
 * @param {(string|RegExp)} search - искомая подстрока
 * @return {string}
 */
Snakeskin.Filters['remove'] = function (str, search) {
	return ((str) + '').replace(search, '');
};

/**
 * Замена подстроки в строке
 *
 * @param {*} str - исходная строка
 * @param {(string|!RegExp)} search - искомая подстрока
 * @param {string} replace - строка для замены
 * @return {string}
 */
Snakeskin.Filters['replace'] = function (str, search, replace) {
	return ((str) + '').replace(search, replace);
};

/**
 * Преобразование объекта в JSON
 *
 * @param {(Object|Array|string|number|boolean)} obj - исходный объект
 * @return {string}
 */
Snakeskin.Filters['json'] = function (obj) {
	if (typeof obj === 'object') {
		return JSON.stringify(obj);
	}

	return ((obj) + '');
};

/**
 * Преобразование JSON в объект
 *
 * @param {*} val - исходное значение
 * @return {?}
 */
Snakeskin.Filters['parse'] = function (val) {
	if (typeof val !== 'string') {
		return val;
	}

	return JSON.parse(val);
};

/**
 * Декларация BEM части
 *
 * @param {*} block - название блока
 * @param {*} part - вторая часть декларации
 * @return {string}
 */
Snakeskin.Filters['bem'] = function (block, part) {
	return ((block) + '') + ((part) + '');
};if (/\[\w+ \w+]/.test(Object.keys && Object.keys.toString())) {
	var keys = Object.keys;
}

/**
 * Конструктор объекта StringBuffer
 *
 * @expose
 * @constructor
 * @return {!Array}
 */
Snakeskin.StringBuffer = function () {
	return [];
};

/**
 * Итератор массива или объекта (с проверкой hasOwnProperty)
 *
 * @expose
 * @param {(Array|Object)} obj - исходный объект
 * @param {(function(?, number, !Array, boolean, boolean, number)|function(?, string, !Object, number, boolean, boolean, number))} callback - функция обратного вызова
 */
Snakeskin.forEach = function (obj, callback) {
	if (!obj) {
		return;
	}

	var length = 0;

	if (Array.isArray(obj)) {
		length = obj.length;
		for (var i = -1; ++i < length;) {
			if (callback(obj[i], i, obj, i === 0, i === length - 1, length) === false) {
				break;
			}
		}

	} else if (keys) {
		var arr = keys(obj);
		length = arr.length;

		for (var i$0 = -1; ++i$0 < length;) {
			if (callback(obj[arr[i$0]], arr[i$0], obj, i$0, i$0 === 0, i$0 === length - 1, length) === false) {
				break;
			}
		}

	} else {
		var i$1 = 0;

		if (callback.length >= 6) {
			for (var key in obj) {
				if (!obj.hasOwnProperty(key)) {
					continue;
				}

				length++;
			}
		}

		for (var key$0 in obj) {
			if (!obj.hasOwnProperty(key$0)) {
				continue;
			}

			if (callback(obj[key$0], key$0, obj, i$1, i$1 === 0, i$1 === length - 1, length) === false) {
				break;
			}

			i$1++;
		}
	}
};

/**
 * Итератор объекта без проверки hasOwnProperty
 *
 * @expose
 * @param {Object} obj - исходный объект
 * @param {function(?, string, !Object, number, boolean, boolean, number)} callback - функция обратного вызова
 */
Snakeskin.forIn = function (obj, callback) {
	if (!obj) {
		return;
	}

	var length = 0,
		i = 0;

	if (callback.length >= 6) {
		for (var key in obj) {
			length++;
		}
	}

	for (var key$1 in obj) {
		if (callback(obj[key$1], key$1, obj, i, i === 0, i === length - 1, length) === false) {
			break;
		}

		i++;
	}
};

	if (IS_NODE) {
		module['exports'] = Snakeskin;

	} else {
		this['Snakeskin'] = Snakeskin;
	}

}).call(this);