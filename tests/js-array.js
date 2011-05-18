var assert = require("assert");
var Query = require("../lib/query").Query;
var executeQuery = require("../lib/js-array").executeQuery;

function assertQuery(query, source, target, opts) {
	opts = opts || {};
	var result = executeQuery(query, opts, source);
	if (opts.log) console.log("QUERY:", query, "->", result);
	assert.deepEqual(result, target);
};

function assertQueryLength(query, source, length, opts) {
	opts = opts || {};
	assert.equal(executeQuery(query, opts, source).length, length);
};

var data = [
	{
		"with/slash": "slashed",
		"nested": {
			"property": "value"
		},
		"price": 10,
		"name": "ten",
		"tags": ["fun", "even"]
	},
	{
		"price": 5,
		"name": "five",
		"tags": ["fun"]
	}];

exports.testFiltering = function() {
	assertQueryLength("price=lt=10", data, 1);
	assertQueryLength("price=lt=11", data, 2);
	assertQueryLength("nested/property=value", data, 1);
	assertQueryLength("with%2Fslash=slashed", data, 1);
	assertQueryLength("out(price,(5,10))", data, 0);
	assertQueryLength("out(price,(5))", data, 1);
	assertQueryLength("contains(tags,even)", data, 1);
	assertQueryLength("contains(tags,fun)", data, 2);
	assertQueryLength("excludes(tags,fun)", data, 0);
	assertQueryLength("excludes(tags,ne(fun))", data, 1);
	assertQueryLength("excludes(tags,ne(even))", data, 0);
	// eq() on re: should trigger .match()
	assertQuery("price=match=10", data, [data[0]]);
	// ne() on re: should trigger .not(.match())
	assertQuery("name=match=f.*", data, [data[1]]);
	assertQuery("name=match=glob:f*", data, [data[1]]);
};

exports.testFiltering1 = function() {
	var data = [{"path.1":[1,2,3]}, {"path.1":[9,3,7]}];
	assertQuery("contains(path,3)&sort()", data, []); // path is undefined
	assertQuery("contains(path.1,3)&sort()", data, data); // 3 found in both
	assertQuery("excludes(path.1,3)&sort()", data, []); // 3 found in both
	assertQuery("excludes(path.1,7)&sort()", data, [data[0]]); // 7 found in second
};


exports.testContains = function() {
	var data = [{a: ['x','y']}, {a: ['x','z']}, ['y'], 'y'];
	assertQuery("contains(y)", data, [data[2]]);
	assertQuery("contains(a,y)", data, [data[0]]);
};

exports.testMixedScalars = function() {
	var data = [
		"a",
		2,
		"foo",
		null,
		"b",
		undefined,
		"c",
		{a: 5, b: {c: 6, d: ["y"]}, c: ["x", 9]},
		{a: 7, b: {c: 8, d: ["x"]}, c: ["y", 9]},
		["a", 3, "c"],
		new Date("2000-01-01T00:00:00Z")
	];


	assertQuery("eq(a)", data, [data[0]]);
	assertQuery("eq(2)", data, [data[1]]);
	assertQuery("eq(foo)&first()", data, data[2]);
	assertQuery("eq(foo)&one()", data, data[2]);
	assertQuery("eq(bar)&one()", data, undefined);

	assertQuery("eq(null)", data, [data[3]]);
	assertQuery("eq(undefined)", data, [data[5]]);
	assertQuery("eq()", data, [data[5]]);

	assertQuery("ge(2)", data, [data[1], data[10]]);
	assertQuery("gt(2)", data, [data[10]]);
	assertQuery("ge(b)", data, [data[2], data[4], data[6]]);
	assertQuery("gt(b)", data, [data[2], data[6]]);

	assertQuery("gt()", data, []);
	assertQuery("le()", data, []);
	assertQuery("le(undefined)", data, []); // why not equivelent to eq(undefined)?
	assertQuery("gt(null)", data, [data[1], data[10]]);
	assertQuery("ge(null)", data, [data[1], data[3], data[10]]);
	assertQuery("lt(null)", data, []);
	assertQuery("le(null)", data, [data[3]]);

	assertQuery("le(a,5)", data, [data[7]]);
	assertQuery("le(b/c,6)", data, [data[7]]);
	assertQuery("gt(b/c,6)", data, [data[8]]);

	assertQuery("contains(a)", data, [data[9]]);
	assertQuery("contains(b)", data, []);
	assertQuery("contains(3)", data, [data[9]]);
	assertQuery("contains(a)&contains(3)", data, [data[9]]);

	//FIXME assertQuery("eq(b/d,(y))", data, [data[7]]);

	assertQuery("contains(c,x)", data, [data[7]]);
	assertQuery("contains(c,9)", data, [data[7], data[8]]);
	//FIXME assertQuery("contains(b/d,x)", data, [data[7], data[8]]);

};

exports.testNonArrayExecution = function() {
	var data = {
		foo: "bar",
		answer: 42,
		list: ["a", 3, "c"]
	};
	assertQuery("eq(foo,bar)", data, data);
	assertQuery("eq(foo,baz)", data);
	assertQuery("eq(bar,baz)", data);
	assertQuery("values(list)", data, data.list);
	assertQuery("select(list)", data, {list: data.list});

	// test scalars directly
	assertQuery("eq(foo)", "foo", "foo");
	assertQuery("ne(foo)", "foo");
	assertQuery("eq(42)", 42, 42);
	assertQuery("ne(43)", 42, 42);
	assertQuery("ge(42)", 42, 42);
	assertQuery("gt(42)", 42);

};

exports.testAssertions = {
	testScalars: function() {
		executeQuery("assert(eq(42))", {}, 42);
		executeQuery("assert(ge(42))", {}, 42);
		assert.throws(function() { executeQuery("assert(eq(42))", {}, 43) });
		assert.throws(function() { executeQuery("assert(gt(42))", {}, 42) });
		executeQuery("assert(eq(foo))", {}, "foo");
		executeQuery("assert(ge(foo))", {}, "foo");
		assert.throws(function() { executeQuery("assert(ne(foo))", {}, "foo") });
		assert.throws(function() { executeQuery("assert(eq(bar))", {}, "foo") });
	},
	testObjects: function() {
		var data = {
			foo: "bar",
			answer: 42
		};
		//assertQuery("assert(eq(answer,42))", data, data, {log: true});
		executeQuery("assert(eq(answer,42))", {}, data);
		executeQuery("assert(eq(foo,bar))", {}, data);
		executeQuery("assert(eq(foo,bar))", {}, data);
	},
	testScalarArrays: function() {
		var data = [4, 2, 7];

		// sum
		// mean > 3
	},
	testObjectArrays: function() {
		var data = [{
			foo: "bar",
			answer: 42
		},{
			foo: "bar",
			answer: 2
		},{
			foo: "baz",
			bar: ["a", 3, "c"]
		}];


		executeQuery("foo=bar&select(answer)&assert(ge(answer,2))&assert(ne(answer,4))", {}, data);
		assert.throws(function() { executeQuery("foo=bar&select(answer)&assert(ge(answer,2))&assert(ne(answer,2))", {}, data) });
		executeQuery("foo=bar&values(answer)&assert(ge(2))", {}, data);
		executeQuery("foo=baz&count()&assert(eq(1))", {}, data);
	},
	testMixedArrays: function() {

	}
};

if (require.main === module) require("patr/lib/test").run(exports);
