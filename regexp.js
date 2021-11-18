const Sample = require('./sample-automata')
const Automaton = require('./automaton')

const EMPTY = 0
const WORD = 1
const STAR = 2
const SUM = 3
const CONCAT = 4
const EPSILON = 'E'

/** Class representing a regular expression */
class RegularExpression {
  /**
     * create a regular expression
     * @param {number|string} type - if string, then a regular expression for this single word is
     * created. If number, then a regular expression of the given type is created.
     * @param {RegularExpression} [r1] - first regular expression
     * @param {RegularExpression} [r2] - second regular expression
     * @returns {RegularExpression} a new regular expression
     */
  constructor (type, r1, r2) {
    // TODO unschön
    if (typeof type !== 'number') {
      r1 = type
      type = WORD
    }
    this.type = type
    if (type === EMPTY) {
      this.equivalentAutomaton = new Automaton()
    }
    if (type === WORD) {
      this.word = r1 === 'E' ? '' : r1
      this.equivalentAutomaton =
                r1 === 'E' ? Sample.onlyEmptyWord() : Sample.onlyWord(r1)
    }
    if (type === STAR) {
      this.star = r1
      this.equivalentAutomaton = r1.equivalentAutomaton
        .star()
        .minimize()
        .renameStates()
    }
    if (type === SUM) {
      this.left = r1
      this.right = r2
      this.equivalentAutomaton = r1.equivalentAutomaton
        .union(r2.equivalentAutomaton)
        .minimize()
        .renameStates()
    }
    if (type === CONCAT) {
      this.left = r1
      this.right = r2
      this.equivalentAutomaton = r1.equivalentAutomaton
        .concat(r2.equivalentAutomaton)
        .minimize()
        .renameStates()
    }
  }

  /**
     * create a regular expression for the empty language
     * @returns {RegularExpression} a new regular expression
     */
  static empty () {
    return new RegularExpression(EMPTY)
  }

  /**
     * create a regular expression that is the star of the given regular expression.
     * @returns {RegularExpression} a new regular expression
     */
  star () {
    return new RegularExpression(STAR, this)
  }

  /**
     * create a regular expression that is the sum of the given regular expression and
     * a second regular expression r.
     * @param {RegularExpression} r - a second regular expression
     * @returns {RegularExpression} a new regular expression
     */
  sum (r) {
    return new RegularExpression(SUM, this, r)
  }

  /**
     * create a regular expression that is the concatenation of the given regular expression and
     * a second regular expression r.
     * @param {RegularExpression} r - a second regular expression
     * @returns {RegularExpression} a new regular expression
     */
  concat (r) {
    if (this.type === WORD && this.word === '') {
      return r
    }
    if (r.type === WORD && r.word === '') {
      return this
    }
    return new RegularExpression(CONCAT, this, r)
  }

  /**
     * check whether a word is accepted, i.e. in the language of the regular expression
     * @param {string} w - a word
     * @returns {boolean} true, if the word is in the language, false otherwise
     */
  accepts (w) {
    return this.equivalentAutomaton.accepts(w)
  }

  /**
     * a generator that returns the accepted words of the given regular expression up to the given
     * maximal length.
     * @param {number} maxLength - the maximal length of generated words
     * @returns {string} the next accepted word
     */
  * acceptedWords (maxLength) {
    // TODO make more elegant: copy generator?
    const words = this.equivalentAutomaton.acceptedWords(maxLength)
    let w
    while ((w = words.next().value) !== undefined) {
      yield w
    }
  }

  /**
     * calculate the similarity of the given regular expression and a second one. The similarity is the
     * ratio of the number of words which both regular expressions accept or accept not to the number of
     * all words up to a given length.
     * @param {RegularExpression} r2 - the second regular expression
     * @param {number} maxLength - the maximal length of words to be considered
     * @returns {number} the similarity ratio with nominator and denominator
     */
  similarity (r2, maxLength) {
    const r1 = this
    return r1.equivalentAutomaton.similarity(
      r2.equivalentAutomaton,
      maxLength
    )
  }

  /**
     * generate regular expressions.
     * @param {number} numberSymbols - the number of alphabet symbols in the generated regular expression.
     * @returns {RegularExpression} the next regular expression.
     */

  static * generate (numberSymbols, symbols = 'ab') {
    if (numberSymbols <= 0) {
      throw new Error('numberSymbols must be at least 1')
    } else if (numberSymbols === 1) {
      // yield new RegularExpression('E')
      for (const sym of symbols) {
        const re = new RegularExpression(sym)
        yield re
        yield re.star()
      }
    } else {
      for (let first = 1; first < numberSymbols; first++) {
        let firstRE
        const firstREgen = RegularExpression.generate(first)
        while ((firstRE = firstREgen.next().value) !== undefined) {
          let secondRE
          const secondREgen = RegularExpression.generate(
            numberSymbols - first
          )
          while ((secondRE = secondREgen.next().value) !== undefined) {
            const s = firstRE.sum(secondRE)
            const c = firstRE.concat(secondRE)
            yield s
            yield c
            yield s.star()
            yield c.star()
          }
        }
      }
    }
  }

  /**
     * convert the regular expression to a string
     * @return {string} a string representation of the regular expression
     */
  toString () {
    const r = this
    let left
    let right

    switch (r.type) {
      case EMPTY:
        return '0'
      case WORD:
        return r.word === '' ? EPSILON : r.word
      case STAR:
        if (r.star.type === WORD && r.star.word.length === 1) {
          return r.star.toString() + '*'
        } else {
          return '(' + r.star.toString() + ')*'
        }
      case SUM:
        return r.left.toString() + '+' + r.right.toString()
      case CONCAT:
        if (r.left.type !== SUM) {
          left = r.left.toString()
        } else {
          left = '(' + r.left.toString() + ')'
        }
        if (r.right.type !== SUM) {
          right = r.right.toString()
        } else {
          right = '(' + r.right.toString() + ')'
        }
        return left + right
    }
  }

  /**
     * checks whether the given regular expression is equivalent to a second regular
     * expression.
     * @param {RegularExpression} r2 - the second regular expression
     * @returns {boolean} true if the two regular expressions are equivalent, false otherwise.
     */
  equivalent (r2) {
    const r1 = this
    return r1.equivalentAutomaton.equivalent(r2.equivalentAutomaton)
  }

  /* only used internally for parse() */
  static lex (reString, symbols = 'ab') {
    const stack = []
    let word = ''
    let re
    let previousChar = ''
    // previousChar === '_' if char was an alphabet symbol
    for (const char of [...reString]) {
      switch (char) {
        case '(':
          if (previousChar === ')' || previousChar === '*') {
            stack.push('.')
          } else if (previousChar === '_') {
            if (word !== '') {
              stack.push(new RegularExpression(word))
              stack.push('.')
              word = ''
            }
          }
          stack.push('(')
          previousChar = char
          break
        case ')':
          if (word !== '') {
            stack.push(new RegularExpression(word))
            word = ''
          }
          stack.push(')')
          previousChar = char
          break
        case '+':
          if (word !== '') {
            re = new RegularExpression(word)
            word = ''
            stack.push(re)
            stack.push('+')
          } else if (
            previousChar === '*' ||
                        previousChar === ')' ||
                        previousChar === EPSILON
          ) {
            stack.push('+')
          } else {
            throw new Error('re lex: syntax error: +')
          }
          previousChar = char
          break
        case '*':
          if (previousChar === '_') {
            re = new RegularExpression(word[word.length - 1]).star()
            word = word.slice(0, word.length - 1)
            if (word.length > 0) {
              stack.push(new RegularExpression(word))
              stack.push('.')
            }
            stack.push(re)
            word = ''
          } else if (previousChar === ')') {
            stack.push('*')
          } else {
            throw new Error('re lex: syntax error')
          }
          previousChar = char
          break
        case EPSILON:
          stack.push(new RegularExpression(''))
          previousChar = char
          break
        default:
          if (symbols.indexOf(char) === -1) {
            throw new Error('re lex: unexpected character: ' + char)
          }
          if (word === '') {
            if (previousChar === ')' || previousChar === '*') {
              stack.push('.')
            }
          }
          word += char
          previousChar = '_'
      }
    }
    if (word !== '') {
      stack.push(new RegularExpression(word))
    }

    // check parenthesis
    let level = 0
    for (let i = 0; i < stack.length; i++) {
      if (stack[i] === '(') {
        level++
      }
      if (stack[i] === ')') {
        level--
        if (level < 0) {
          throw new Error('re lex: unexpected closing parenthesis')
        }
      }
    }
    if (level !== 0) {
      throw new Error('re lex: unmatched parenthesis')
    }
    return stack
  }

  static parse (reString, symbols = 'ab') {
    const LPAREN = 1
    const RPAREN = 2
    const RPARENSTAR = 22
    const PLUS = 3
    const WORD = 4
    const CHARSTAR = 5
    const EPS = 6
    const RENULL = 7
    const END = 8
    const tokens = []

    function tokenize (input) {
      let i = 0
      let token
      // to have always a followingt character
      input = input.concat('$')
      while (i < input.length) {
        const c = input[i]
        let word
        switch (c) {
          case '(':
            token = { type: LPAREN, value: '(' }
            tokens.push(token)
            break
          case ')':
            if (input[i + 1] === '*') {
              token = { type: RPARENSTAR, value: ')' }
              i++
            } else {
              token = { type: RPAREN, value: ')' }
            }
            tokens.push(token)
            break
          case '+':
            token = { type: PLUS, value: '+' }
            tokens.push(token)
            break
          case 'E':
          case '1':
            token = { type: EPS, value: '' }
            tokens.push(token)
            break
          case '0':
            token = { type: RENULL, value: '0' }
            tokens.push(token)
            break
          case '$':
            tokens.push({ type: END, value: null })
            break
          default:
            if (symbols.indexOf(c) === -1) {
              throw new Error(
                're lex: unexpected character: ' + c
              )
            }
            word = ''
            while (symbols.indexOf(input[i]) !== -1) {
              if (input[i + 1] === '*') {
                if (word !== '') {
                  tokens.push({ type: WORD, value: word })
                  word = ''
                }
                tokens.push({
                  type: CHARSTAR,
                  value: input[i]
                })
                i++
                i++
                break
              } else {
                word = word.concat(input[i])
                i++
              }
            }
            if (word !== '') {
              tokens.push({ type: WORD, value: word })
            }
            i--
        }
        i++
      }
    }

    let pos = 0

    function factor () {
      let token = tokens[pos]
      if (token.type === LPAREN) {
        pos++
        const f = re()
        token = tokens[pos]
        if (token.type === RPAREN) {
          pos++
          return f
        }
        if (token.type === RPARENSTAR) {
          pos++
          return f.star()
        }
        throw new Error('re factor1: unexpected token: ' + token.type)
      }
      if (token.type === WORD) {
        pos++
        return new RegularExpression(token.value)
      }
      if (token.type === CHARSTAR) {
        pos++
        const r = new RegularExpression(token.value)
        return r.star()
      }
      if (token.type === EPS) {
        pos++
        return new RegularExpression('')
      }
      throw new Error('re factor2: unexpected token: ' + token.type)
    }

    function product () {
      const f = factor()
      const token = tokens[pos]
      if (
        token.type === END ||
                token.type === PLUS ||
                token.type === RPAREN ||
                token.type === RPARENSTAR
      ) {
        return f
      } else {
        const p = product()
        return f.concat(p)
      }
    }

    function re () {
      const left = product()
      if (
        tokens[pos].type === END ||
                tokens[pos].type === RPAREN ||
                tokens[pos].type === RPARENSTAR
      ) {
        return left
      } else {
        if (tokens[pos].type === PLUS) {
          pos++
          const right = re()
          return left.sum(right)
        } else {
          throw new Error('re: unexpected token: ' + tokens[pos].type)
        }
      }
    }

    reString = reString.replace(/\s+/g, '')
    const anyChar = '(' + [...symbols].join('+') + ')'
    reString = reString.replace(/\./g, anyChar)
    tokenize(reString)
    return re()
  }
}

module.exports = RegularExpression
