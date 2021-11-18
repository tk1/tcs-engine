var should = require('chai').should()
var Automaton = require('../automaton.js');

describe('edge', function () {
    var a = new Automaton('edge')
    for (let i = 1; i <= 5; i++) {
        a.addState(String(i), false, false)
    }
    it('addEdge', function () {
        var e = a.addEdge('1', '2', 'a')
        a.edges.size.should.equal(1)
        a.getStateByName('1').edgesOut.has(e).should.be.true
        a.getStateByName('2').edgesIn.has(e).should.be.true
        a.getStateByName('3').edgesOut.has(e).should.be.false
        a.getStateByName('3').edgesIn.has(e).should.be.false
    })
})
