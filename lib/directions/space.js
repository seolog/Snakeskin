var __NEJS_THIS__ = this;
/**!
 * @status stable
 * @version 1.0.0
 */

/**
 * Директива &
 *
 * @param {string} command - название команды (или сама команда)
 *
 * @param {number} commandLength - длина команды
 * @param {!DirObj} dirObj - объект управления директивами
 *
 * @param {Object} adv - дополнительные параметры
 * @param {!Object} adv.info - информация о шаблоне (название файлы, узла и т.д.)
 */
Snakeskin.Directions['&'] = function (command, commandLength, dirObj, adv) {
	var __NEJS_THIS__ = this;
	if (!dirObj.tplName) {
		throw dirObj.error('Directive "&" can only be used within a template or prototype, ' +
			dirObj.genErrorAdvInfo(adv.info)
		);
	}

	if (!dirObj.parentTplName && !dirObj.protoStart) {
		dirObj.space = true;
	}
};