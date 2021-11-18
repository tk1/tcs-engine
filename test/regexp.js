var should = require('chai').should()
var RegularExpression = require('../regexp.js')
var ExtRegularExpression = require('../ext-regexp.js')
var Automaton = require('../automaton.js')
var Sample = require('../sample-automata')

describe('regular expression', function() {
    var a = new RegularExpression('a')
    var b = new RegularExpression('b')
    var all = a.sum(b).star()
    var abb = new RegularExpression('abb')
    var ba = new RegularExpression('ba')
    var bas = ba.star()
    var eps = new RegularExpression('E')
    var ea

    it('toString', function() {
        all
            .concat(abb)
            .concat(all)
            .toString()
            .should.equal('(a+b)*abb(a+b)*')
        abb
            .sum(bas)
            .toString()
            .should.equal('abb+(ba)*')
    })
    it('equivalent automaton starts with abb', function() {
        ea = abb.concat(all).equivalentAutomaton.minimize()
        ea.equivalent(Sample.startsWith('abb')).should.be.true
    })
    it('equivalent automaton ends with abb', function() {
        ea = all.concat(abb).equivalentAutomaton.minimize()
        ea.equivalent(Sample.endsWith('abb')).should.be.true
    })
    it('equivalent automaton subword abb', function() {
        ea = all
            .concat(abb)
            .concat(all)
            .equivalentAutomaton.minimize()
        ea.equivalent(Sample.subword('abb')).should.be.true
    })
    it('equivalent automaton starts with abb and ends with ba', function() {
        ea = abb.concat(all).concat(ba).equivalentAutomaton
        ea.equivalent(
            Sample.startsWith('abb')
                .intersect(Sample.endsWith('ba'))
                .intersect(Sample.minLength(5))
        ).should.be.true
    })
    it('equivalent re subword ba', function() {
        var r1 = all.concat(ba).concat(all)
        var r2 = a
            .star()
            .concat(b)
            .concat(b.star())
            .concat(a)
            .concat(all)
        r1.equivalent(r2).should.be.true
    })
    it('equivalent ba concat eps', function() {
        ea = ba.concat(eps).equivalentAutomaton
        ea.equivalent(Sample.onlyWord('ba')).should.be.true
    })
    var testCaseAccepts = [
        ['a(a+b)*', ['a', 'aa', 'ab', 'abaa'], ['', 'b', 'ba']],
        ['a(a+b)*b', ['ab', 'abb'], ['', 'a', 'b', 'aba']],
        ['a(a+b)*+b(a+bb)*', ['a', 'aa', 'aaa', 'aba'], ['bb', 'bab']]
    ]
    it('accepts', function() {
        for (let tc of testCaseAccepts) {
            for (let w of tc[1]) {
                RegularExpression.parse(tc[0]).accepts(w).should.be.true
            }
            for (let w of tc[2]) {
                RegularExpression.parse(tc[0]).accepts(w).should.be.false
            }
        }
    })
    var testCases = [
        ['E', 'E'],
        ['aa+b', 'aa|+|b'],
        ['aa+b+aba', 'aa|+|b|+|aba'],
        ['aa+b*', 'aa|+|b*'],
        ['aa+ab*', 'aa|+|a|.|b*'],
        ['aa+ab*ba', 'aa|+|a|.|b*|.|ba'],
        ['(aa+b)', '(|aa|+|b|)', 'aa+b'],
        ['(aa+b)a', '(|aa|+|b|)|.|a'],
        ['(aa+b)ab', '(|aa|+|b|)|.|ab'],
        ['(aa+b)(a+b)', '(|aa|+|b|)|.|(|a|+|b|)'],
        ['(a+b)*', '(|a|+|b|)|*'],
        ['(ab+ba)*', '(|ab|+|ba|)|*'],
        ['a+(ab+ba)*', 'a|+|(|ab|+|ba|)|*'],
        ['(ab+ba)*+a', '(|ab|+|ba|)|*|+|a'],
        ['((a+b)a+bb)', '(|(|a|+|b|)|.|a|+|bb|)', '(a+b)a+bb'],
        ['(a+b)*ab', '(|a|+|b|)|*|.|ab'],
        ['ab(a+b)*', 'ab|.|(|a|+|b|)|*'],
        ['(a+b)*aba(a+b)*', '(|a|+|b|)|*|.|aba|.|(|a|+|b|)|*'],
        ['b+E', 'b|+|E'],
        ['b+E+bb', 'b|+|E|+|bb'],
        ['b+E+bb*b', 'b|+|E|+|b|.|b*|.|b']
    ]
    /* TODO
    it('lex', function() {
        for (let tc of testCases) {
            /*
            RegularExpression.lex(tc[0])
                .join('|')
                .should.equal(tc[1])
            
            console.log(tc[0])
            console.log(RegularExpression.parse(tc[0]).toString())
        }
    })
    */
    it('parse', function() {
        for (let tc of testCases) {
            RegularExpression.parse(tc[0])
                .toString()
                .should.equal(tc.length > 2 ? tc[2] : tc[0])
        }
        ea = RegularExpression.parse(
            '(a+b)*abb(a+b)*'
        ).equivalentAutomaton.minimize()
        ea.equivalent(Sample.subword('abb')).should.be.true
    })
    it('intersect', function() {
        var re1 = RegularExpression.parse('a(a+b)*')
        var re2 = RegularExpression.parse('(a+b)*a')
        var r = ExtRegularExpression.intersect(re1, re2)
        var re12 = RegularExpression.parse('a+a(a+b)*a')
        r.equivalent(re12).should.be.true
    })
})
