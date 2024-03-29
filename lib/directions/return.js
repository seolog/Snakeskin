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
			var useCallback = this.hasParent(this.getGroup('callback'));

			var async = this.getGroup('async');
			var chunk,
				val;

			if (command) {
				chunk = this.prepareOutput(command, true);
				val = (("return " + chunk) + ";");

			} else {
				val = (("return " + (this.returnResult())) + ";");
			}

			if (useCallback) {
				var prfx = (("\
\n					__RETURN__ = true;\
\n					" + (chunk ? (("__RETURN_VAL__ = " + chunk) + ";") : '')) + "\
\n				");

				if (async[strongParent]) {
					if (strongParent === 'waterfall') {
						this.append((("\
\n							" + prfx) + "\
\n							return arguments[arguments.length - 1](false);\
\n						"));

					} else {
						this.append((("\
\n							" + prfx) + "\
\n\
\n							if (typeof arguments[0] === 'function') {\
\n								return arguments[0](false);\
\n							}\
\n\
\n							return false;\
\n						"));
					}

				} else {
					this.append((("\
\n						" + prfx) + "\
\n						return false;\
\n					"));
				}

				this.deferReturn = chunk ? true : val;

			} else {
				this.append(val);
			}
		}
	}
);