require('./extendSet')
const Alphabet = require('./alphabet')

/** Class representing an context-free grammar. */
class ContextFreeGrammar {
  /**
     * Create an context-free grammar.
     * @param {string} [terminals] - the terminal symbols.
     * @returns {Automaton} new context-free grammar
     */

  constructor (terminals = 'ab') {
    const g = this
    g.variables = new Map()
    g.terminals = new Alphabet(terminals)
  }

  addVariable (name, start = false) {
    const g = this
    if (!g.variables.has(name)) {
      g.variables.set(name, { start: start, rules: [] })
    }
    return g.variables.get(name)
  }

  addRule (variable, rightSide) {
    const g = this
    const v = g.addVariable(variable)
    v.rules.push(rightSide)
  }

  addRules (variable, rightSides) {
    const g = this
    rightSides.split('|').forEach(rs => {
      g.addRule(variable, rs)
    })
  }

  isVariable (name) {
    return this.variables.has(name)
  }

  static isEmptyRuleText (text) {
    return ContextFreeGrammar.removeWhitespaceAndComments(text) === ''
  }

  static removeWhitespaceAndComments (text) {
    return text.replace(/\s+/g, '').replace(/#.*$/, '')
  }

  static checkRuleText (text) {
    // TODO use Unicode property escapes
    const textWithoutWhitespace = ContextFreeGrammar.removeWhitespaceAndComments(text)
    if (textWithoutWhitespace.length === 0) {
      return true
    }
    const ruleRegExp = /^[A-Z]-?>[a-zA-Z|]+$/
    return ruleRegExp.test(textWithoutWhitespace)
  }

  static parse (text) {
    // TODO use Unicode property escapes
    const reLowerCase = /[a-z]/
    const reUpperCase = /[A-Z]/
    let result
    result = [...text].filter(c => c.match(reLowerCase))
    if (result.length === 0) {
      throw new Error('there are no terminals')
    }
    // make unique
    const terminals = (Array.from(new Set(result))).sort()

    // TODO use Unicode property escapes
    result = [...text].filter(c => c.match(reUpperCase))
    if (result.length === 0) {
      throw new Error('there are no variables')
    }
    const variables = (Array.from(new Set(result)))
    const g = new ContextFreeGrammar(terminals.join(''))

    if (variables.includes('S')) {
      g.addVariable('S', true)
    } else {
      g.addVariable(variables[0], true)
    }
    const rules = text.split(/\n/).filter(r => !ContextFreeGrammar.isEmptyRuleText(r))
    rules.forEach(r => {
      if (!ContextFreeGrammar.checkRuleText(r)) {
        throw new Error(`error in rule ${r}`)
      } else {
        const part = ContextFreeGrammar.removeWhitespaceAndComments(r).replace(/\s+/g, '').split(/-?>/)
        g.addRules(part[0], part[1])
      }
    })

    return g
  }

  /**
     * convert the context-free grammar to a string
     * @return {string} a string representing the context-free grammar
    */

  toString () {
    const g = this
    let s = 'terminals: ' + g.terminals.symbols + '\n'
    s += 'rules:\n'
    g.variables.forEach((value, key) => {
      s += (value.start ? 'start:' : '') + key + '->'
      s += value.rules.join('|')
      s += ';\n'
    })
    return s
  }

  toLatex () {
    const g = this
    let s = '\\[\n\\begin{array}{lll}\n'
    g.variables.forEach((value, key) => {
      s += `${key} &\\to&` + value.rules.join('\\,|\\,') + '\\\\\n'
    })
    return s + '\\end{array}\n\\]'
  }

  checkCNF () {
    const g = this
    let cnf = true
    let offRule = ''
    // TODO shortcut if false
    g.variables.forEach((value, key) => {
      value.rules.forEach(v => {
        if (v.length === 0 || v.length > 2) {
          cnf = false
          offRule = `wrong length:  ${key}->${v}`
        }
        if (v.length === 1) {
          if (!g.terminals.symbols.includes(v)) {
            cnf = false
            offRule = `${v} is not a terminal in: ${key}->${v}`
          }
        }
        if (v.length === 2) {
          if (!g.isVariable(v[0]) || !g.isVariable(v[1])) {
            cnf = false
            offRule = `variable not derivable in: ${key}->${v}`
          }
        }
      })
    })
    return { isCNF: cnf, offendingRule: offRule }
  }

  cyk (word) {
    const g = this

    function reverse () {
      const rr = new Map()
      g.variables.forEach((value, key) => {
        value.rules.forEach(v => {
          if (!rr.has(v)) {
            rr.set(v, new Set())
          }
          rr.set(v, rr.get(v).add(key))
        })
      })
      return rr
    }
    const reversedRules = reverse()
    const v = []
    v[0] = [...word].map(char => {
      return reversedRules.has(char) ? reversedRules.get(char) : new Set()
    })
    // v[1].unshift(0)
    const n = word.length
    for (let k = 1; k < n; k++) {
      v[k] = []
      for (let i = 0; i < n - k; i++) {
        v[k][i] = new Set()
        for (let m = 0; m < k; m++) {
          v[m][i].forEach(v1 => {
            v[k - m - 1][i + m + 1].forEach(v2 => {
              if (reversedRules.has(v1 + v2)) {
                v[k][i] = v[k][i].union(reversedRules.get(v1 + v2))
              }
            })
          })
        }
      }
    }
    return v
  }

  cykResultToString (v) {
    let s = ''
    v.forEach(row => {
      row.forEach(col => {
        s += Array.from(col).sort().join(',')
        s += '; '
      })
      s += '\n'
    })
    return s
  }

  cykResultToTikz (word, v) {
    let s = '\\begin{tikzpicture}[->, >=stealth, node distance = 2.2cm, minimum width=2.2cm, minimum height=1cm, auto]\n'
            ;[...word].forEach((char, i) => {
      const right = (i === 0 ? '' : `[right of=${i - 1}]`)
      s += `\\node[] (${i}) ${right} {$${char}$};\n`
    })
    let offset = word.length
    let previousOffset = 0
    v.forEach(row => {
      row.forEach((col, i) => {
        let label
        if (col.size === 0) {
          label = '{$\\emptyset$}'
        } else {
          label = '{$' + [...col].sort().join(',') + '$}'
        }
        s += `\\node[draw](${i + offset}) [below=0cm of ${i + previousOffset}] ${label};\n`
      })
      previousOffset = offset
      offset += row.length
    })
    s += '\\end{tikzpicture}'
    return s
  }
}

module.exports = ContextFreeGrammar
