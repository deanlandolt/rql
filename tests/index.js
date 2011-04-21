var assert = require("assert");

exports.testJSArray = require("./js-array");
exports.testQuery = require("./query");

var rql = require("../lib/index");
exports.testMain = function() {
	var results = rql("foo>1&sort(-foo)", null, [{foo: 1}, {foo: 3}, {foo: 2}]);
	assert.equal(results.length, 2);
	assert.equal(results[0].foo, 3);
	assert.equal(results[1].foo, 2);
};


if (require.main === module) require("patr/lib/test").run(exports);
