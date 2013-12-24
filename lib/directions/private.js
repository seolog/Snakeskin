var __NEJS_THIS__ = this;
/**!
 * @status stable
 * @version 1.0.0
 */

/**
 * Директива __appendLine__
 *
 * @param {string} command - название команды (или сама команда)
 *
 * @param {number} commandLength - длина команды
 * @param {!DirObj} dirObj - объект управления директивами
 *
 * @param {Object} adv - дополнительные параметры
 * @param {!Object} adv.info - информация о шаблоне (название файлы, узла и т.д.)
 */
Snakeskin.Directions['__appendLine__'] = function (command, commandLength, dirObj, adv) {
	var __NEJS_THIS__ = this;
	if (!dirObj.openBlockI) {
		throw dirObj.error('Directive "cdata" can only be used within a template or prototype, ' +
			dirObj.genErrorAdvInfo(adv.info)
		);
	}

	adv.info.line += parseInt(command);
};