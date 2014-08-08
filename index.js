//#!/usr/bin/env node

global.Snakeskin = require('./snakeskin');
var program = require('commander');

program
	['version'](Snakeskin.VERSION.join('.'))

	.option('-s, --source [src]', 'path to the template file')
	.option('-o, --output [src]', 'path to the file to save')
	.option('-n, --common-js', 'common.js export (for node.js)')
	.option('-d, --data [src]', 'path to the data file (JSON) or data JSON')

	.option('--disable-localization', 'disable support for localization')
	.option('--language [src]', 'path to the localization file (JSON) or localization JSON')
	.option('--words [src]', 'path to the localization file to save')

	.option('--disable-xml-validation', 'disable default xml validation')
	.option('--interface', 'render all templates as interface')
	.option('--string-buffer', 'use StringBuffer for concatenate strings')
	.option('--inline-iterators', 'inline forEach and forIn')
	.option('--disable-escape-output', 'disable default "html" filter')
	.option('--pretty-print', 'formatting output')

	.parse(process.argv);

var fs = require('fs');
var path = require('path');

var params = {
	xml: !program['disableXmlValidation'],
	commonJS: program['commonJs'],
	localization: !program['disableLocalization'],
	language: program['language'],
	words: program['words'],
	interface: program['interface'],
	stringBuffer: program['stringBuffer'],
	inlineIterators: program['inlineIterators'],
	escapeOutput: !program['disableEscapeOutput'],
	prettyPrint: program['prettyPrint']
};

var lang = params.language;
if (lang) {
	try {
		params.language = JSON.parse(lang);

	} catch (ignore) {
		params.language = JSON.parse(fs.readFileSync(lang).toString());
	}
}

var words = params.words,
	dataSrc = program['data'];

if (words) {
	params.words = {};
}

var input;

if (!program['source'] && process.argv.length > 2) {
	input = process.argv[process.argv.length - 1];
}

var file = program['source'],
	newFile = program['output'];

function action(data) {
	if (!data && !file) {
		program['help']();
	}

	var tpls = {};

	if (dataSrc) {
		params.commonJS = true;
		params.context = tpls;
	}

	var str = String(data),
		res = Snakeskin.compile(str, params, {file: file});

	if (res !== false) {
		if (dataSrc) {
			var main;

			if (file) {
				main = tpls[path.basename(file, '.ss')] || tpls.main || tpls[Object.keys(tpls)[0]];

			} else {
				main = tpls.main || tpls[Object.keys(tpls)[0]];
			}

			if (!main) {
				console.error('Template is not defined');
				process.exit(1);
			}

			var dtd;

			try {
				dtd = JSON.parse(dataSrc);

			} catch (ignore) {
				dtd = JSON.parse(fs.readFileSync(dataSrc).toString());
			}

			if (input && !program['output'] || !newFile) {
				console.log(main(dtd));

			} else {
				fs.writeFileSync(newFile, main(dtd));
				console.log((("File \"" + file) + ("\" has been successfully compiled \"" + newFile) + "\"."));
			}

		} else {
			if (input && !program['output'] || !newFile) {
				console.log(res);

			} else {
				fs.writeFileSync(newFile, res);
				console.log((("File \"" + file) + ("\" has been successfully compiled \"" + newFile) + "\"."));
			}
		}

	} else {
		process.exit(1);
	}

	if (words) {
		fs.writeFileSync(words, JSON.stringify(params.words, null, '\t'));
	}

	process.exit(0);
}

action(file ? fs.readFileSync(file).toString() : input);