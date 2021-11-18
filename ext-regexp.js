const RegularExpression = require('./regexp')
const GeneralizedAutomaton = require('./generalized-automaton')
const grammar = require('./grammar-re.js')
const nearley = require('nearley')

/**
 * Class representing a regular expression with some additional methods
 * @extends RegularExpression
 */
class ExtRegularExpression extends RegularExpression {
  // can't be in regexp.js because then GeneralizedAutomaton includes RegularExpression and vice versa
  // TODO as instance methods (not static)

  /**
     * Determine the intersection of two regular expressions by constructing
     * the intersection of the equivalent automata and converting the resulting
     * automaton to a regular expression.
     * @param {RegularExpression} re1 - first regular expression
     * @param {RegularExpression} re2 - second regular expression
     * @returns {RegularExpression} a regular expression describing the intersection of
     * the languages of the first and second regular expression.
     */
  static intersect (re1, re2) {
    const a1 = re1.equivalentAutomaton
    const a2 = re2.equivalentAutomaton
    const a = a1.intersect(a2)
    const ga = GeneralizedAutomaton.copyOf(a)
    return ga.equivalentRE()
  }

  /**
     * Determine the complement of a regular expression by constructing
     * the complement of the equivalent equivalentAutomaton and converting it
     * to a regular expression.
     * @param {RegularExpression} r - a regular expression
     * @returns {RegularExpression} a regular expression describing the complement
     * of the language of the given regular expression
     */
  static complement (r) {
    const a = r.equivalentAutomaton.complement()
    const ga = GeneralizedAutomaton.copyOf(a)
    return ga.equivalentRE()
  }

  /**
     * Build a regular expression from an automaton
     * @param {Automaton} a - a automaton
     * @returns {RegularExpression} a regular expression describing the
     * accepted language of the automaton
     */
  static fromAutomaton (a) {
    const ga = GeneralizedAutomaton.copyOf(a)
    return ga.equivalentRE()
  }

  /**
     * convert a string to a regular expression
     * @param {string} reString - string representation of regular expression, allowed symbols: a-z
     * @returns {RegularExpression} a new regular expression if parsing successful, throws
     * an error otherwise
     * @deprecated use parse with Nearley parser
     */
  static parse (reString) {
    const parser = new nearley.Parser(
      grammar.ParserRules,
      grammar.ParserStart
    )

    // Parse something
    parser.feed(reString)
    return parser.results[0].v
  }
}

module.exports = ExtRegularExpression
