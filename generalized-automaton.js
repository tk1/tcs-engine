const Automaton = require('./automaton')
const RegularExpression = require('./regexp')

const SYMBOL = 'a'

/**
 * Class representing a generalized automaton
 * @extends Automaton
 */
class GeneralizedAutomaton extends Automaton {
  // symbol of all edges is 'a'
  // regular expression in property re

  /**
     *
     * @param {Automaton} aut
     * @returns {GeneralizedAutomaton} a new generalized automaton that is a copy of the
     * automaton aut.
     */
  static copyOf (aut) {
    const ga = new GeneralizedAutomaton('generalized ' + aut.name)
    if (aut.isEmpty()) {
      return ga
    }

    const a = aut

    const startState = ga.addState('start', true, false, {}, true)
    const finalState = ga.addState('final', false, true, {}, true)
    for (const s of a.states) {
      const newState = ga.addState(s.name, false, false, {}, true)
      if (s.start) {
        ga.addEdge(startState, newState, new RegularExpression(''))
      }
      if (s.final) {
        ga.addEdge(newState, finalState, new RegularExpression(''))
      }
    }

    for (const e of a.edges) {
      ga.addEdge(
        e.source.name,
        e.sink.name,
        new RegularExpression(e.symbol)
      )
    }
    return ga
  }

  /**
     *
     * @param {State|string} from - the state where the edge starts
     * @param {State|string} to - the where the edge ends
     * @param {RegularExpression} re - the regular expression to use as a label for the edge
     */
  addEdge (from, to, re) {
    const a = this
    let e = a.getEdge(from, to, SYMBOL)
    if (e !== undefined) {
      e.re = e.re.sum(re)
    } else {
      e = super.addEdge(from, to, SYMBOL)
      e.re = re
    }
    return e
  }

  /**
     * @returns {RegularExpression} an regular expression that describes the accepted language
     * of the automaton.
     */
  equivalentRE () {
    const a = this

    if (a.isEmpty()) {
      return RegularExpression.empty()
    }

    while (a.states.size > 2) {
      const removeState = [...a.states].find(s => !s.start && !s.final)
      let loopRE
      for (const edgeIn of removeState.edgesIn) {
        if (edgeIn.source === edgeIn.sink) {
          if (loopRE === undefined) {
            loopRE = edgeIn.re
          } else {
            loopRE = loopRE.sum(edgeIn.re)
          }
        }
      }
      for (const edgeIn of removeState.edgesIn) {
        if (edgeIn.source !== edgeIn.sink) {
          for (const edgeOut of removeState.edgesOut) {
            if (edgeOut.source !== edgeOut.sink) {
              if (loopRE === undefined) {
                a.addEdge(
                  edgeIn.source.name,
                  edgeOut.sink.name,
                  edgeIn.re.concat(edgeOut.re)
                )
              } else {
                a.addEdge(
                  edgeIn.source.name,
                  edgeOut.sink.name,
                  edgeIn.re
                    .concat(loopRE.star())
                    .concat(edgeOut.re)
                )
              }
            }
          }
        }
      }
      a.deleteState(removeState)
    }
    if (a.edges.size === 0) {
      return new RegularExpression(0)
    } else {
      return [...a.edges][0].re
    }
  }
}

module.exports = GeneralizedAutomaton
