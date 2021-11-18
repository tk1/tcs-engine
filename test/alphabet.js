var should = require('chai').should()
var Alphabet = require('../alphabet.js');

var a = new Alphabet("ab")

describe('alphabet', function () {
    var count = 0
    it('genAllWords', function () {
        var words = new Alphabet("ab").genAllWords()
        var expectedWords = ['', 'a', 'b', 'aa', 'ab', 'ba', 'bb', 'aaa', 'aab', 'aba', 'abb', 'baa', 'bab', 'bba', 'bbb']
        for (let i = 0; i < 15; i++) {
            var w = words.next().value
            w.should.equal(expectedWords[i])
        }
    })
    it('length', function () {
        var words = a.genWords(4)
        var w = words.next().value
        while (w != undefined) {
            w.length.should.equal(4)
            count++
            w = words.next().value
        }
    })
    it('count', function () {
        count.should.equal(16)
    })
    it('numberOf', function () {
        a.numberOf("a", "a").should.equal(1)
        a.numberOf("b", "a").should.equal(0)
        a.numberOf("aabbaa", "a").should.equal(4)
        a.numberOf("aabbab", "b").should.equal(3)
    })
    it('randomWord', function () {
        var w
        var min = 60
        var max = 70
        for (let i = 0; i < 10; i++) {
            w = a.randomWord(min, min)
            w.should.have.lengthOf(min)
            w = a.randomWord(min, max)
            w.should.have.length.within(min, max)
        }
    })
})


