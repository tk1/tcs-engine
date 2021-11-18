var should = require('chai').should()
require("../extendSet")

var s1 = new Set([1, 2, 3])
var s2 = new Set([3, 1, 2])
var s3 = new Set([1, 3])

describe('set', function() {
    it('contains', function () {
        s1.contains(s3).should.be.true
        s3.contains(s1).should.be.false
    })
    it('equals', function () {
        s1.equals(s2).should.be.true
        s2.equals(s1).should.be.true
        s1.equals(s3).should.be.false
        s3.equals(s1).should.be.false      
    })
    it('name', function () {
        s1.name().should.equal("1,2,3")
        s2.name().should.equal("1,2,3")
        s3.name().should.equal("1,3")
    })
})
