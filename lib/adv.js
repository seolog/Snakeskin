var commandRgxp = /([^\s]+).*/;

/**
 * Вернуть объект-описание преобразованной части шаблона из
 * Jade-Like синтаксиса в стандартный
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

	for (var j = i - 1; ++j < str.length;) {
		length++;

		var el = str.charAt(j),
			next = str.charAt(j + 1);

		var next2str = el + next,
			diff2str = str.substring(j + 1, j + 3);

		if (nextLineRgxp.test(el)) {
			clrL = true;
			spaces = 0;
			space = '\n';
			tSpace++;

		} else if (clrL) {
			if (whiteSpaceRgxp.test(el)) {
				spaces++;
				space += el;
				tSpace++;

			} else {
				clrL = false;
				var nextSpace = false;

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

				var dir = (shortMap[el] || shortMap[next2str]) && nextSpace,
					decl = getLineDesc(str, nextSpace && baseShortMap[el] || el === IGNORE_COMMAND ? j + 1 : j, Boolean(dir));

				if (!decl) {
					this.error('invalid syntax');
					return {
						str: '',
						length: 0,
						error: true
					};
				}

				var replacer = void 0;

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

				var adv = el === ADV_LEFT_BLOCK ?
					ADV_LEFT_BLOCK : '';

				var s = dir ? adv + LEFT_BLOCK : '',
					e = dir ? RIGHT_BLOCK : '';

				var obj = {
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
								if (chains[struct.name] && chains[struct.name][obj.name]) {
									obj.block = true;
									obj.name = struct.name;

								} else {
									res += genEndDir(struct);
								}
							}

							struct = struct
								.parent;

							if (!struct) {
								return {
									str: res,
									length: length - tSpace - 1
								};
							}
						}

						obj.parent = struct;
					}
				}

				var parts = void 0,
					txt = void 0;

				if (dir) {
					parts = decl.command.split(INLINE_COMMAND);
					txt = parts.slice(1).join(INLINE_COMMAND);
					txt = txt && txt.trim();
				}

				struct = obj;
				res += space + s + (dir ? parts[0] : decl.command) + e;

				if (obj.block) {
					res += (("" + s) + ("__&__" + e) + "");
				}

				var tmp = decl.length - 1;
				tSpace = 0;

				length += tmp;
				j += tmp;

				if (dir && txt) {
					var inline = {
						dir: false,
						spaces: spaces + 1,
						space: '',
						parent: obj,
						block: false,
						adv: ''
					};

					inline.parent = obj;
					struct = inline;
					res += txt;
				}
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
		length: length
	};
};

/**
 * Вернуть строку окончания блоковой директивы
 *
 * @param {!Object} dir - объект-описание директивы
 * @return {string}
 */
function genEndDir(dir) {
	var s = dir.adv + LEFT_BLOCK,
		e = RIGHT_BLOCK;

	return (("" + s) + ("__&__" + e) + ("\n" + s) + ("__end__" + e) + ("" + s) + ("__cutLine__" + e) + ("" + s) + ("__&__" + e) + "");
}

/**
 * Вернуть объект описание строки в Jade-Like синтаксисе
 *
 * @param {string} str - исходная строка
 * @param {number} i - номер начальной итерации
 * @param {?boolean=} dir - если true, то идёт декларация директивы
 * @return {{command: string, length: number, name: string, lastEl: string}}
 */
function getLineDesc(str, i, dir) {
	var res = '',
		name = '';

	var lastEl = '',
		lastElI = 0,
		length = -1;

	var concatLine = false,
		nmBrk = null;

	for (var j = i - 1; ++j < str.length;) {
		var el = str.charAt(j);
		length++;

		if (nextLineRgxp.test(el)) {
			var prevEl = lastEl,
				brk = false;

			lastEl = '';
			if (dir && str.charAt(j - 2) === ' ') {
				brk = prevEl === CONCAT_END;

				if (prevEl === CONCAT_COMMAND || brk) {
					res = res.substring(0, lastElI) + el + res.substring(lastElI + 1);
				}

				if (concatLine && !brk) {
					continue;
				}

				if (prevEl === CONCAT_COMMAND) {
					concatLine = true;
					continue
				}
			}

			if (concatLine && !brk) {
				continue;
			}

			return {
				command: res,
				length: length,
				name: name,
				lastEl: lastEl
			};

		} else {
			var whiteSpace = lineWhiteSpaceRgxp.test(el);

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

	if (dir && lastEl === CONCAT_END && res.charAt(lastElI - 1) === ' ') {
		res = res.substring(0, lastElI) + res.substring(lastElI + 1);
	}

	return {
		command: res,
		length: length,
		name: name,
		lastEl: lastEl
	};
}