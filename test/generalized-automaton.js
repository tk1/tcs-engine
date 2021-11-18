var Automaton = require('../automaton.js')
var Sample = require('../sample-automata')
var RegularExpression = require('../regexp')
var GeneralizedAutomaton = require('../generalized-automaton')

function testAutomaton(a) {
    var name = a.name.length > 80 ? a.name.slice(0, 80) + '...' : a.name
    it(name, function() {
        var re = GeneralizedAutomaton.copyOf(a).equivalentRE()
        //console.log(re.toString())
        re.equivalentAutomaton.equivalent(a).should.be.true
    })
}

function testRegularExpression(reString) {
    it(reString, function() {
        var r = RegularExpression.parse(reString)
        var re = GeneralizedAutomaton.copyOf(
            r.equivalentAutomaton
        ).equivalentRE()
        //console.log(re.toString())
        re.equivalent(r).should.be.true
    })
}

describe('GeneralizedAutomaton', function() {
    testAutomaton(Sample.endsWith('b'))
    testAutomaton(Sample.endsWith('ab'))
    testAutomaton(Sample.startsWith('ab'))
    testAutomaton(Sample.subword('ab'))
    testAutomaton(Sample.numberOfSymbols('a', 2, 3))
    testAutomaton(Sample.startsWith('ab').union(Sample.endsWith('b')))
    testAutomaton(Sample.onlyWord('abbab'))
    testAutomaton(Sample.endsWith('a').union(Sample.endsWith('b')))
    testAutomaton(Sample.onlyWord('a').star())
    testAutomaton(Sample.onlyWord('a').union(Sample.onlyWord('b')))
    testAutomaton(
        Sample.onlyWord('a')
            .union(Sample.onlyWord('b'))
            .star()
    )
    testAutomaton(Sample.startsWith('a').intersect(Sample.endsWith('b')))
    testAutomaton(Sample.lengthRange(1, 2))
    testAutomaton(Sample.lengthRange(5, 9))
    testAutomaton(Sample.subword('a').complement())
    testRegularExpression('b+E+bb*b')
    testAutomaton(Sample.subword('ab').complement())
    testRegularExpression('b+a+E+bb*(b+a)+(a+bb*a)a*a')
    testAutomaton(Sample.subword('aba').complement())
    testRegularExpression(
        'b+a+E+bb*(b+a)+(a+bb*a)a*(a+b)+(a+bb*a)a*b(bb*aa*b)*(b+bb*(b+a)+bb*aa*(a+b))'
    )
    testRegularExpression('(a+b)*ab(a+b)*')
    testRegularExpression('(a+b)*ab(a+b)*bb(a+b)*')
    testRegularExpression('(a+b)*(a+b)*bb(a+b)*(a+b)*')
    testRegularExpression('ab(a+b)*ab(a+b)*ab')
})
