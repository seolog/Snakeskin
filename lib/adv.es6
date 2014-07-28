var commandRgxp = /([^\s]+).*/;

/**
 * Вернуть объект-описание преобразованной части шаблона из
 * jade-like синтаксиса в стандартный
 *
 * @param {string} str - исходная строка
 * @param {number} i - номер начальной итерации
 * @return {{str: string, length: number, error: (boolean|null|undefined)}}
 */
DirObj.prototype.toBaseSyntax = function (str, i) {
	var clrL = true,
		spaces = 0,
		space = '';

	var struct,
		res = '';

	var length = 0,
		tSpace = 0;

	for (let j = i; j < str.length; j++) {
		length++;

		let el = str.charAt(j),
			next = str.charAt(j + 1);

		let next2str = el + next,
			diff2str = str.substring(j + 1, j + 3);

		if (nextLineRgxp.test(el)) {
			clrL = true;
			spaces = 0;
			space = '\n';
			tSpace++;

		} else {
			if (whiteSpaceRgxp.test(el)) {
				spaces++;
				space += el;
				tSpace++;

			} else if (clrL) {
				clrL = false;
				let nextSpace = false;

				if (el === ADV_LEFT_BLOCK) {
					if (shortMap[diff2str]) {
						nextSpace = whiteSpaceRgxp.test(str.charAt(j + 3));

					} else if (shortMap[next]) {
						nextSpace = whiteSpaceRgxp.test(str.charAt(j + 2));

					} else {
						nextSpace = whiteSpaceRgxp.test(next);
					}

				} else {
					if (shortMap[next2str]) {
						nextSpace = whiteSpaceRgxp.test(str.charAt(j + 2));

					} else {
						nextSpace = whiteSpaceRgxp.test(next);
					}
				}

				let dir = (shortMap[el] || shortMap[next2str]) && nextSpace,
					decl = getLineDesc(str, baseShortMap[el] || el === IGNORE_COMMAND ? j + 1 : j);

				if (!decl) {
					this.error('invalid syntax');
					return {
						str: '',
						length: 0,
						error: true
					};
				}

				let replacer;

				if (el === ADV_LEFT_BLOCK) {
					replacer = replacers[diff2str] ||
						replacers[next] ||
						replacers[next2str] ||
						replacers[el];

				} else {
					replacer = replacers[next2str] ||
						replacers[el];
				}

				if (replacer) {
					decl.name = replacer(decl.name).replace(commandRgxp, '$1');
				}

				let adv = el === ADV_LEFT_BLOCK ?
					ADV_LEFT_BLOCK : '';

				let obj = {
					command: decl.command,
					dir: dir,
					name: decl.name,
					spaces: spaces,
					space: space,
					parent: null,
					block: dir && block[decl.name],
					adv: adv
				};

				if (struct) {
					if (struct.spaces < spaces && struct.block) {
						obj.parent = struct;

					} else if (struct.spaces === spaces || struct.spaces < spaces && !struct.block) {
						if (struct.block) {
							res += genEndDir(struct);
						}

						obj.parent = struct.parent;

					} else {
						while (struct.spaces >= spaces) {
							if (struct.block) {
								res += genEndDir(struct);
							}

							struct = struct
								.parent;

							if (!struct) {
								return {
									str: res,
									length: length - tSpace
								};
							}
						}

						obj.parent = struct;
					}
				}

				struct = obj;
				res += space +
					adv +
					(dir ? LEFT_BLOCK : '') +
					decl.command +
					(dir ? RIGHT_BLOCK : '');

				length += decl.command.length - 1;
				j += decl.command.length - 1;

				tSpace = 0;
			}
		}
	}

	while (struct) {
		if (struct.block) {
			res += genEndDir(struct);
		}

		struct = struct
			.parent;
	}

	return {
		str: res,
		length: length + 1
	};
};

/**
 * Вернуть строку окончания блоковой директивы
 *
 * @param {!Object} dir - объект-описание директивы
 * @return {string}
 */
function genEndDir(dir) {
	return `${dir.adv + LEFT_BLOCK}__end__${RIGHT_BLOCK}`;
}

/**
 * Вернуть объект описание строки в jade-like синтаксисе
 *
 * @param {string} str - исходная строка
 * @param {number} i - номер начальной итерации
 * @return {{command: string, name: string, lastEl: string}}
 */
function getLineDesc(str, i) {
	var res = '',
		name = '';

	var lastEl = '',
		lastElI = 0;

	var concatLine = false;
	var nmBrk = null;

	for (let j = i; j < str.length; j++) {
		let el = str.charAt(j);

		if (nextLineRgxp.test(el)) {
			let prevEl = lastEl;
			lastEl = '';

			if (prevEl === CONCAT_COMMAND || prevEl === CONCAT_END) {
				res = res.substring(0, lastElI) + el + res.substring(lastElI + 1);
			}

			if (concatLine && prevEl !== CONCAT_END) {
				continue;
			}

			if (prevEl === '&') {
				concatLine = true;
				continue
			}

			return {
				command: res,
				name: name,
				lastEl: lastEl
			};

		} else {
			let whiteSpace = lineWhiteSpaceRgxp.test(el);

			if (whiteSpace) {
				if (nmBrk === false) {
					nmBrk = true;
				}

			} else {
				lastEl = el;
				lastElI = res.length;
			}

			if (!nmBrk && !whiteSpace) {
				if (nmBrk === null) {
					nmBrk = false;
				}

				name += el;
			}

			if (nmBrk !== null) {
				res += el;
			}
		}
	}

	return {
		command: res,
		name: name,
		lastEl: lastEl
	};
}