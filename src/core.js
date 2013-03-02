var Snakeskin = {
		VERSION: '1.3.2',
		
		Filters: {},
		Vars: {
			BEMtag: {}
		},
		
		cache: {}
	},
	
	SS = Snakeskin;

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
	//#include escape.js
	//#include inherit.js
	//#include other.js
	//#include compiler.js
	//#endif
	
	// common.js экспорт
	if (require) {
		for (key in Snakeskin) {
			if (!Snakeskin.hasOwnProperty(key)) { continue; }
			exports[key] = Snakeskin[key];
		}
	}
})(typeof window === 'undefined');