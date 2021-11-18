var should = require('chai').should()
var Util = require('../util.js');

describe('util', function () {
    var count = 0
    it('base62', function () {
        for (let i = 70; i < 10000; i += 109) {
            var b = Util.toBase62(i)
            var ib = Util.fromBase62(b)
            ib.should.equal(i)
        }
    })
})


