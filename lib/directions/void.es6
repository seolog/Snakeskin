Snakeskin.addDirective(
	'void',

	{
		notEmpty: true,
		replacers: {
			'?': (cmd) => cmd.replace(/^\?/, 'void ')
		}
	},

	function (command) {
		if (/(?:^|\s+)(?:var|const|let) /.test(command)) {
			return this.error('can\'t declare variables within "void"');
		}

		this.startInlineDir();
		if (this.isSimpleOutput()) {
			this.save(`${this.prepareOutput(command, true)};`);
		}
	}
);