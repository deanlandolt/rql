({define:typeof define!="undefined"?define:function(deps, factory){module.exports = factory(exports, require("./parser"), require("./query"), require("./js-array"));}}).
define(["exports", "./parser", "./query", "./js-array"], function(exports, parser, query, jsArray){

// this seems like the most logical entry point	
exports = jsArray.query;

// expose modules
exports.jsArray = jsArray;
exports.query = query;
exports.parser = parser

	
return exports;
});
