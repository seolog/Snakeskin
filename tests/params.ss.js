/* This code is generated automatically, don't alter it. */var Snakeskin = global.Snakeskin;exports.init = function (obj) { Snakeskin = typeof obj === "object" ? obj : require(obj);delete exports.init;exec();return this;};function exec() {/* Snakeskin template: param_base; a, b  */exports.param_base= function (a,b) { b = b !== void 0 && b !== null ? b : 1;var __SNAKESKIN_RESULT__ = '', $_;var TPL_NAME = 'param_base';var PARENT_TPL_NAME;__SNAKESKIN_RESULT__ += ' ';__SNAKESKIN_RESULT__ += Snakeskin.Filters.html(Snakeskin.Filters.undef(b));__SNAKESKIN_RESULT__ += ' ';return __SNAKESKIN_RESULT__; };if (typeof Snakeskin !== 'undefined') {Snakeskin.cache['param_base'] = exports.param_base;}/* Snakeskin template. *//* Snakeskin template: param_child;  */exports.param_child= function () { var __SNAKESKIN_RESULT__ = '', $_;var TPL_NAME = 'param_child';var PARENT_TPL_NAME;PARENT_TPL_NAME = 'param_base';var b = 2;__SNAKESKIN_RESULT__ += ' ';__SNAKESKIN_RESULT__ += Snakeskin.Filters.html(Snakeskin.Filters.undef(b));__SNAKESKIN_RESULT__ += ' ';return __SNAKESKIN_RESULT__; };if (typeof Snakeskin !== 'undefined') {Snakeskin.cache['param_child'] = exports.param_child;}/* Snakeskin template. *//* Snakeskin template: param_child2;  */exports.param_child2= function () { var __SNAKESKIN_RESULT__ = '', $_;var TPL_NAME = 'param_child2';var PARENT_TPL_NAME;PARENT_TPL_NAME = 'param_child';var b = 3;__SNAKESKIN_RESULT__ += ' ';__SNAKESKIN_RESULT__ += Snakeskin.Filters.html(Snakeskin.Filters.undef(b));__SNAKESKIN_RESULT__ += ' ';return __SNAKESKIN_RESULT__; };if (typeof Snakeskin !== 'undefined') {Snakeskin.cache['param_child2'] = exports.param_child2;}/* Snakeskin template. *//* Snakeskin templating system. Generated at: Fri Feb 07 2014 14:29:42 GMT+0400 (Московское время (зима)). */}