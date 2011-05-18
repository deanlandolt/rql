/**
 * Namespace: rql
 *
 * This is the main entry point for rql, exposing the underlying modules.
 */
({define:typeof define!="undefined"?define:function(deps, factory){module.exports = factory(exports, require("./parser"), require("./query"), require("./js-array"));}}).
define(["exports", "./parser", "./query", "./js-array"], function(exports, parser, query, jsArray){

// this seems like the most logical entry point
exports = jsArray.query;


// Function: jsArray
// Exports:
// <rql/lib/js-array>
exports.jsArray = jsArray;

// Function: query
// Exports:
// <rql/lib/query>
exports.query = query;

// Function: parser
// Exports:
// <rql/lib/parser>
exports.parser = parser


return exports;
});
