Snakeskin.addDirective(
	'script',

	{
		placement: 'template',
		block: true
	},

	function (command) {
		this.startDir();
		this.space = true;

		if (this.isReady()) {
			if (command) {
				command = command.replace(tagRgxp, 'js $1');

			} else {
				command = 'js';
			}

			var parts = command.split(' '),
				type = parts[0];

			var types = {
				'js': 'text/javascript',
				'dart': 'application/dart',
				'coffee': 'application/coffeescript',
				'ts': 'application/typescript',
				'json': 'application/json',
				'html': 'text/html'
			};

			this.append(this.wrap((("'<script type=\"" + (types[type] || this.replaceTplVars(type))) + "\"'")));

			if (parts.length > 1) {
				var args = [].slice.call(arguments);

				args[0] = parts.slice(1).join(' ');
				args[1] = args[0].length;

				Snakeskin.Directions['attr'].apply(this, args);
				this.inline = false;
			}

			this.append(this.wrap('\'>\''));
		}
	},

	function () {
		this.append(this.wrap('\'</script>\''));
	}
);