/*!
 * Шаблонный движок с поддержкой наследования
 */

var Snakeskin = {
	VERSION: '2.3.17',

	Directions: {},

	Filters: {},
	BEM: {},
	Vars: {},

	write: {},
	cache: {}
};

(function (require) {
	'use strict';

	//#if old.live
	//#include es5shim.live.js
	//#endif

	//#include live.js
	//#include filters.js

	//#if old
	//#include es5shim.js
	//#endif

	//#if withCompiler
	//#include global.js
	//#include api.js
	//#include escape.js
	//#include inherit.js
	//#include error.js

	//#include compiler.js
	//#include output.js

	//#include directions/end.js

	//#include directions/template.js
	//#include directions/call.js
	//#include directions/void.js
	//#include directions/var.js

	//#include directions/block.js
	//#include directions/proto.js

	//#include directions/iterator.js
	//#include directions/logic.js
	//#include directions/scope.js
	//#include directions/const.js

	//#include directions/cut.js
	//#include directions/bem.js
	//#include directions/data.js

	//#endif

	// common.js экспорт
	if (require) {
		module.exports = Snakeskin;
	}
})(typeof window === 'undefined');