/*!
 * Директивы proto и apply
 */

/**
 * Если true, то значит объявляется прототип
 * @type {boolean}
 */
DirObj.prototype.protoStart = false;

/**
 * Директива proto
 *
 * @param {string} command - название команды (или сама команда)
 * @param {number} commandLength - длина команды
 *
 * @param {!DirObj} dirObj - объект управления директивами
 * @param {!Object} adv - дополнительные параметры
 * @param {boolean} adv.dryRun - true, если холостая обработка
 * @param {!Object} adv.info - информация о шаблоне (название файлы, узла и т.д.)
 */
Snakeskin.Directions['proto'] = function (command, commandLength, dirObj, adv) {
	var tplName = dirObj.tplName,
		parentName = dirObj.parentTplName;

	if (!adv.dryRun && ((parentName && !dirObj.hasPos('block') && !dirObj.hasPos('proto')) || !parentName)) {
		// Попытка декларировать прототип блока несколько раз
		if (protoCache[tplName][command]) {
			throw dirObj.error(
				'Proto "' + command + '" is already defined ' +
				'(command: {proto' + command + '}, template: "' + tplName + ', ' +
					dirObj.genErrorAdvInfo(adv.info) +
				'")!'
			);
		}

		protoCache[tplName][command] = {from: dirObj.i - dirObj.startI + 1};
	}

	dirObj.pushPos('proto', {
		name: command,
		i: ++dirObj.openBlockI,
		startI: dirObj.i + 1
	}, true);

	if (!parentName) {
		dirObj.protoStart = true;
	}
};

/**
 * Окончание proto
 *
 * @param {string} command - название команды (или сама команда)
 * @param {number} commandLength - длина команды
 *
 * @param {!DirObj} dirObj - объект управления директивами
 * @param {!Object} adv - дополнительные параметры
 * @param {boolean} adv.dryRun - true, если холостая обработка
 */
Snakeskin.Directions['protoEnd'] = function (command, commandLength, dirObj, adv) {
	var tplName = dirObj.tplName,
		parentTplName = dirObj.parentTplName,
		i = dirObj.i;

	var backHash = dirObj.backHash,
		lastProto = dirObj.popPos('proto');

	if (!adv.dryRun && ((parentTplName && !dirObj.hasPos('block') && !dirObj.hasPos('proto')) || !parentTplName)) {
		protoCache[tplName][lastProto.name].to = i - dirObj.startI - commandLength - 1;
		fromProtoCache[tplName] = i - dirObj.startI + 1;
	}

	// Рекурсивно анализируем прототипы блоков
	if (!parentTplName) {
		protoCache[tplName][lastProto.name].body = Snakeskin.compile('{template ' + tplName + '()}' +
			dirObj.source.substring(lastProto.startI, i - commandLength - 1) +
			'{end}', null, null, true, dirObj.getPos('with'));
	}

	if (backHash[lastProto.name] && !backHash[lastProto.name].protoStart) {
		Snakeskin.forEach(backHash[lastProto.name], function (el) {
			dirObj.replace(dirObj.res.substring(0, el) +
				protoCache[tplName][lastProto.name].body +
				dirObj.res.substring(el));
		});

		delete backHash[lastProto.name];
		dirObj.backHashI--;
	}

	if (!dirObj.hasPos('proto')) {
		dirObj.protoStart = false;
	}
};

/**
 * Кеш обратных вызовов прототипов
 */
DirObj.prototype.backHash = {
	init: function () {
		return {};
	}
};

/**
 * Количество обратных вызовов прототипа
 * (когда apply до декларации вызываемого прототипа)
 * @type {number}
 */
DirObj.prototype.backHashI = 0;

/**
 * Имя последнего обратного прототипа
 * @type {?string}
 */
DirObj.prototype.lastBack = null;

/**
 * Директива apply
 *
 * @param {string} command - название команды (или сама команда)
 * @param {number} commandLength - длина команды
 * @param {!DirObj} dirObj - объект управления директивами
 */
Snakeskin.Directions['apply'] = function (command, commandLength, dirObj) {
	if (!dirObj.parentTplName && !dirObj.hasPos('proto')) {
		// Попытка применить не объявленный прототип
		// (запоминаем место вызова, чтобы вернуться к нему,
		// когда прототип будет объявлен)
		if (!protoCache[dirObj.tplName][command]) {
			if (!dirObj.backHash[command]) {
				dirObj.backHash[command] = [];
				dirObj.backHash[command].protoStart = dirObj.protoStart;

				dirObj.lastBack = command;
				dirObj.backHashI++;
			}

			dirObj.backHash[command].push(dirObj.res.length);

		} else {
			dirObj.save(protoCache[dirObj.tplName][command].body);
		}
	}
};