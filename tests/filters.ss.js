/* This code is generated automatically, don't alter it. */var Snakeskin = global.Snakeskin;exports.init = function (obj) { Snakeskin = typeof obj === "object" ? obj : require(obj);delete exports.init;exec();return this;};function exec() {if (typeof Snakeskin !== 'undefined') { Snakeskin.Vars.a = String; }/* Snakeskin template: filters_index;  */exports.filters_index= function () { var __SNAKESKIN_RESULT__ = '', $_;var TPL_NAME = 'filters_index';var PARENT_TPL_NAME;__SNAKESKIN_RESULT__ += ' ';var a = {a: String};__SNAKESKIN_RESULT__ += ' ';__SNAKESKIN_RESULT__ += ' ';__SNAKESKIN_RESULT__ += Snakeskin.Filters.html(($_ = Snakeskin.Filters['remove'](($_ = Snakeskin.Filters['repeat'](($_ = Snakeskin.Filters['ucfirst'](($_ = Snakeskin.Filters['collapse']('   foo   bar ')))),3)),($_=Snakeskin.Filters['repeat']($_=Snakeskin.Filters['trim']('   Foo bar'))))));__SNAKESKIN_RESULT__ += ' ';__SNAKESKIN_RESULT__ += ($_ = Snakeskin.Filters['remove']($_ = Snakeskin.Filters['repeat']($_ = Snakeskin.Filters['ucfirst']($_ = Snakeskin.Filters['collapse']('   foo   bar ')),3),($_=Snakeskin.Filters['repeat']($_=Snakeskin.Filters['trim'](a.a('   Foo bar')))))) + '<b>1</b>';__SNAKESKIN_RESULT__ += ' ';__SNAKESKIN_RESULT__ += Snakeskin.Filters.html(($_ = Snakeskin.Filters['remove']($_ = Snakeskin.Filters['repeat']($_ = Snakeskin.Filters['ucfirst']($_ = Snakeskin.Filters['collapse']('   foo   bar ')),3),($_=Snakeskin.Filters['repeat']($_=Snakeskin.Filters['trim'](Snakeskin.Vars['a']('   Foo bar')))))) + '<b>1</b>');__SNAKESKIN_RESULT__ += ' ';__SNAKESKIN_RESULT__ += ' ';return __SNAKESKIN_RESULT__; };if (typeof Snakeskin !== 'undefined') {Snakeskin.cache['filters_index'] = exports.filters_index;}/* Snakeskin template. *//* Snakeskin templating system. Generated at: Tue Jan 14 2014 14:48:03 GMT+0400 (Московское время (зима)). */}