var varDeclRgxp = /\bvar\b/,
	splitDeclRgxp = /;/,
	forRgxp = /\s*(var|)\s+(.*?)\s+(in|of)\s+(.*)/;

Snakeskin.addDirective(
	'for',

	{
		block: true,
		notEmpty: true,
		group: 'cycle'
	},

	function (command) {
		this.startDir();

		if (splitDeclRgxp.test(command)) {
			let parts = command.split(';');

			if (parts.length !== 3) {
				return this.error(`invalid "${this.name}" declaration`);
			}

			if (this.isReady()) {
				let decl = varDeclRgxp.test(parts[0]) ?
					this.multiDeclVar(parts[0].replace(varDeclRgxp, '')) : this.prepareOutput(parts[0], true);

				parts[1] = parts[1] && `(${parts[1]})`;
				parts[2] = parts[2] && `(${parts[2]})`;

				this.append(`for (${decl + this.prepareOutput(parts.slice(1).join(';'), true)}) {`);
			}

		} else {
			let parts = forRgxp.exec(command);

			if (!parts) {
				return this.error(`invalid "${this.name}" declaration`);
			}

			if (this.isReady()) {
				let decl = parts[1] ?
					this.multiDeclVar(parts[2], false, '') : this.prepareOutput(parts[2], true);

				this.append(`for (${decl} ${parts[3]} ${this.prepareOutput(parts[4], true)}) {`);
			}
		}
	},

	function () {
		this.append('}');
	}
);

Snakeskin.addDirective(
	'while',

	{
		block: true,
		notEmpty: true,
		group: 'cycle'
	},

	function (command) {
		if (this.structure.name == 'do') {
			this.structure.params.chain = true;

			if (this.isReady()) {
				this.append(`} while (${this.prepareOutput(command, true)});`);
			}

			Snakeskin.Directions['end'].call(this);

		} else {
			this.startDir();
			if (this.isReady()) {
				this.append(`while (${this.prepareOutput(command, true)}) {`);
			}
		}
	},

	function () {
		this.append('}');
	}
);

Snakeskin.addDirective(
	'do',

	{
		block: true,
		group: 'cycle',
		after: {
			'while': true,
			'end': true
		}
	},

	function () {
		this.startDir();
		this.append('do {');
	},

	function () {
		if (!this.structure.params.chain) {
			this.append('} while (true);');
		}
	}
);

Snakeskin.addDirective(
	'repeat',

	{
		block: true,
		group: 'cycle',
		after: {
			'until': true,
			'end': true
		}
	},

	function () {
		this.startDir();
		this.append('do {');
	},

	function () {
		if (!this.structure.params.chain) {
			this.append('} while (true);');
		}
	}
);

Snakeskin.addDirective(
	'until',

	{
		placement: 'template',
		notEmpty: true
	},

	function (command) {
		if (this.structure.name !== 'repeat') {
			return this.error(`directive "${this.name}" can be used only with a "repeat"`);
		}

		this.structure.params.chain = true;

		if (this.isReady()) {
			this.append(`} while (${this.prepareOutput(command, true)});`);
		}

		Snakeskin.Directions['end'].call(this);
	}
);