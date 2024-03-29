Snakeskin.addDirective(
	'return',

	{
		placement: 'template'
	},

	function (command) {
		var strongParent = this.structure.parent.name;

		this.startInlineDir();
		this.space = true;

		if (this.isReady()) {
			let useCallback = this.hasParent(this.getGroup('callback'));

			let async = this.getGroup('async');
			let chunk,
				val;

			if (command) {
				chunk = this.prepareOutput(command, true);
				val = `return ${chunk};`;

			} else {
				val = `return ${this.returnResult()};`;
			}

			if (useCallback) {
				let prfx = `
					__RETURN__ = true;
					${chunk ? `__RETURN_VAL__ = ${chunk};` : ''}
				`;

				if (async[strongParent]) {
					if (strongParent === 'waterfall') {
						this.append(`
							${prfx}
							return arguments[arguments.length - 1](false);
						`);

					} else {
						this.append(`
							${prfx}

							if (typeof arguments[0] === 'function') {
								return arguments[0](false);
							}

							return false;
						`);
					}

				} else {
					this.append(`
						${prfx}
						return false;
					`);
				}

				this.deferReturn = chunk ? true : val;

			} else {
				this.append(val);
			}
		}
	}
);