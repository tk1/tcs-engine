var should = require('chai').should()
var Automaton = require('../automaton.js')
var Sample = require('../sample-automata')
var Util = require('../util')

function randomTest(aut) {
    var a = aut.alphabet
    it('accept random word', function() {
        for (let i = 0; i < 20; i++) {
            var w = a.randomWord(100, 200)
            //console.log(w)
            aut.accepts(w).should.equal(aut.inLanguage(w))
        }
    })
}

function shortWordTest(aut) {
    var a = aut.alphabet
    var total = 0
    const maxTotal = 3000
    for (let length = 0; length <= 10 && total < maxTotal; length++) {
        it('accept length ' + length, function() {
            var words = a.genWords(length)
            var w
            while ((w = words.next().value) != undefined) {
                aut.accepts(w).should.equal(aut.inLanguage(w))
                if (total++ > maxTotal) {
                    break
                }
            }
        })
    }
}

function signature(aut) {
    if (aut.isDeterministic()) {
        var s1 = aut.signatureDFS()
        var s2 = aut.signatureNumberedDFS()
        s1.should.equal(s2)
    }
}

function testAutomaton(aut, det) {
    describe('automaton ' + aut.name, function() {
        it('deterministic', function() {
            aut.isDeterministic().should.equal(det)
        })
        it('minimize', function() {
            var aBrz = a.minimize('Brzozowski')
            var aHop = a.minimize('Hopcroft')
            aBrz.equivalent(aHop).should.be.true
        })

        shortWordTest(aut)
        randomTest(aut)
        signature(aut)
    })
}

testAutomaton(Sample.endsWith('ab'), false)
var a4 = Sample.endsWith('abbba')
testAutomaton(a4, false)
var a4d = a4.makeDeterministic()
testAutomaton(a4d, true)
testAutomaton(Sample.startsWith('ab'), true)
testAutomaton(Sample.startsWith('abbba'), true)
testAutomaton(Sample.subword('ab'), false)

var sw_abbbab = Sample.subword('abbbab')
testAutomaton(sw_abbbab, false)
var sw_abbbab_d = sw_abbbab.makeDeterministic()
testAutomaton(sw_abbbab_d, true)
var sw_abbbab_r = sw_abbbab.reverse()
testAutomaton(sw_abbbab_r, false)

testAutomaton(Sample.numberOfSymbols('a', 3, 7), true)

var u = Sample.startsWith('ab').union(Sample.endsWith('b'))
testAutomaton(u, false)
testAutomaton(u.normalize(), false)

var ud = u.makeDeterministic()
testAutomaton(ud, true)

var nr = Sample.notReachable(3)
testAutomaton(nr, false)

var a = Sample.endsWith('ab').concat(Sample.endsWith('bb'))
testAutomaton(a, false)
testAutomaton(a.minimize(), true)

testAutomaton(Sample.subword('ab').complement(), true)

testAutomaton(Sample.onlyWord('abbab'), true)

testAutomaton(Sample.subword('ab').intersect(Sample.subword('ba')), false)
testAutomaton(Sample.lengthRange(2, 4), true)

describe('automaton intersect', function() {
    it('length', function() {
        let a = Sample.lengthRange(5, 9)
        let b = Sample.minLength(5).intersect(Sample.maxLength(9))
        a.equivalent(b).should.be.true
    })
    testAutomaton(Sample.subword('ab').intersect(Sample.subword('ba')), false)
})

describe('automaton star', function() {
    it('subword abb star', function() {
        let a = Sample.subword('abb').star()
        let b = Sample.subword('abb').union(Sample.onlyEmptyWord())
        a.equivalent(b).should.be.true
    })
    it('star star', function() {
        let a = Sample.startsWith('abb').star()
        let b = a.star()
        a.equivalent(b).should.be.true
    })
    it('union of star', function() {
        let a = Sample.endsWith('a').star()
        let b = Sample.endsWith('b').star()
        a.union(b).equivalent(Sample.allWords()).should.be.true
    })
})

describe('accepted words', () => {
    it('all words', () => {
        let a = Sample.allWords()
        a.acceptsAllWords().should.be.true
        let b = Sample.startsWith('a').union(Sample.startsWith('b'))
        b.acceptsAllWords().should.be.false
        let c = b.union(Sample.onlyEmptyWord())
        c.acceptsAllWords().should.be.true
    })
    it('no words', () => {
        let a = Sample.noWords()
        a.acceptsNoWords().should.be.true
        let b = Sample.startsWith('a').intersect(Sample.startsWith('b'))
        b.acceptsNoWords().should.be.true
        let c = Sample.onlyEmptyWord()
        c.acceptsNoWords().should.be.false
    })
})

describe('automaton constructFromSignature', function() {
    it('subword abb', function() {
        let a = Sample.subword('abb')
        let b = Automaton.constructFromSignature(a.minimize().signatureDFS())
        a.equivalent(b).should.be.true
    })
    it('starts with ab and subword bb', function() {
        let a = Sample.startsWith('ab').intersect(Sample.subword('bb'))
        let b = Automaton.constructFromSignature(a.minimize().signatureDFS())
        a.equivalent(b).should.be.true
    })
    it("ends with many a's then b", function() {
        var word = 'b'
        for (let i = 0; i < 15; i++) {
            word = 'aaaaaaaaaa' + word
        }
        var a = Sample.endsWith(word).makeDeterministic()
        var siga = a.signatureDFS()
        var b = Automaton.constructFromSignature(siga)
        var sigb = b.signatureDFS()
        siga.should.equal(sigb)
    })
})

describe('deleteEdge', function() {
    it('ends with ab', function() {
        let a = Sample.endsWith('ab')
        a.deleteEdgeFts('1', '2', 'b')
        a.addEdge('1', '2', 'a')
        let b = Sample.endsWith('aa')
        a.equivalent(b).should.be.true
    })
})

describe('deleteState', function() {
    it('ends with ab', function() {
        let a = Sample.endsWith('ab')
        a.deleteState('2')
        a.getStateByName('1').final = true
        let b = Sample.endsWith('a')
        a.equivalent(b).should.be.true
    })
})

describe('alphabet abc', function() {
    testAutomaton(Sample.endsWith('ab', 'abc'), false)
    testAutomaton(Sample.endsWith('cc', 'abc'), false)
    testAutomaton(Sample.startsWith('ab', 'abc'), true)
    testAutomaton(Sample.startsWith('cc', 'abc'), true)
    testAutomaton(Sample.subword('ab', 'abc'), false)
    testAutomaton(Sample.subword('cc', 'abc'), false)
})

describe('ismorphic', function() {
    var a1 = new Automaton('a1')
    for (let i = 0; i < 5; i++) {
        a1.addState(String(i), i <= 1 ? true : false, i === 3 ? true : false)
    }
    a1.addEdge('0', '2', 'a')
    a1.addEdge('0', '3', 'a')
    a1.addEdge('0', '1', 'b')
    a1.addEdge('1', '3', 'a')
    a1.addEdge('1', '4', 'a')
    a1.addEdge('2', '3', 'b')
    a1.addEdge('3', '1', 'b')
    a1.addEdge('4', '3', 'b')

    var p = Util.randomPermutation(a1.states.size)
    var a2 = a1.copy().renameStates(p)
    it('equivalent', function() {
        a1.equivalent(a2).should.be.true
    })
    it('isomorphic', function() {
        a1.isomorphic(a2).should.be.true
    })
})
