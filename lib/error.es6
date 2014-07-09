/**
 * Вывести дополнительную информацию об ошибке
 * @return {string}
 */
DirObj.prototype.genErrorAdvInfo = function () {
	var info = this.info,
		str = '';

	if (!info) {
		return str;
	}

	for (let key in info) {
		if (!info.hasOwnProperty(key) || info[key] == null) {
			continue;
		}

		if (!info[key].innerHTML) {
			str += `${key}: ${info[key]}, `;

		} else {
			str += `${key}: (class: ${info[key].className || 'undefined'}, id: ${info[key].id || 'undefined'}), `;
		}
	}

	str = str.replace(/, $/, '');
	var line = info['line'];

	if (line) {
		let prev = this.lines[line - 2],
			current = this.lines[line - 1];

		let sep = new Array(Math.max(prev ? prev.length : 0, current.length) || 5).join('#');
		str += `\n${sep}${prev ? `\n ${line - 2} : ${prev}` : ''}\n> ${line - 1} : ${current}\n${sep}`;
	}

	return str;
};

/**
 * Генерировать заданную ошибку
 * @param {string} msg - сообщение ошибки
 */
DirObj.prototype.error = function (msg) {
	var report = `${msg}, ${this.genErrorAdvInfo()}`,
		error = new Error(report);

	error.name = 'SnakeskinError';
	this.brk = true;

	if (this.onError) {
		this.onError(error);

	} else {
		if (typeof console === 'undefined' || typeof console.error === 'function' || this.throws) {
			throw error;
		}

		console.error(report);
	}
};