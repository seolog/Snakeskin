var __NEJS_THIS__ = this;
/**!
 * @status stable
 * @version 1.0.0
 */

/**
 * Директива super
 *
 * @param {string} command - название команды (или сама команда)
 *
 * @param {number} commandLength - длина команды
 * @param {!DirObj} dirObj - объект управления директивами
 *
 * @param {Object} adv - дополнительные параметры
 * @param {!Object} adv.info - информация о шаблоне (название файлы, узла и т.д.)
 */
Snakeskin.Directions['super'] = function (command, commandLength, dirObj, adv) {
	var __NEJS_THIS__ = this;
	if (!dirObj.openBlockI) {
		throw dirObj.error('Directive "super" can only be used within a template or prototype, ' +
			dirObj.genErrorAdvInfo(adv.info)
		);
	}

	if (!dirObj.parentTplName && !dirObj.protoStart) {
		var type = command.split(' ');
		//console.log(command)

		/*if (type[0] === 'block') {
			console.log(121, blockCache[extMap[dirObj.tplName]][type[1]].body);

			dirObj.source = dirObj.source.substring(0, dirObj.i + 1) +
				blockCache[extMap[dirObj.tplName]][type[1]].body +
				dirObj.source.substring(dirObj.i + 1);
		}*/
	}
};