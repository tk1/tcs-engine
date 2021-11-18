/** @module */
const Automaton = require('./automaton')

/* define the functions first and export them later.
 * So jsdoc recognizes the default values of params automatically.
 */

/**
 * construct an automaton for the language of all words that end with a given word
 * @param {string} word - the word to end with
 * @param {string} [symbols] - the symbols of the alphabet
 * @returns {Automaton} a new automaton
 */
function endsWith (word, symbols = 'ab') {
  const aut = new Automaton('ends with ' + word, symbols)
  aut.inLanguage = function (w) {
    return w.endsWith(word)
  }
  const q0 = aut.addState('0', true)
    ;[...aut.alphabet.symbols].forEach(s => aut.addEdge(q0, q0, s))
  ;[...word].forEach((s, i) => {
    aut.addState((i + 1).toString())
    aut.addEdge(i.toString(), (i + 1).toString(), s)
  })
  const finalState = aut.getStateByName(word.length.toString())
  finalState.makeFinal()
  return aut
}

/**
 * construct an automaton for the language of all words that start with a given word
 * @param {string} word - the word to start with
 * @param {string} [symbols] - the symbols of the alphabet
 * @returns {Automaton} a new automaton
 */

function startsWith (word, symbols = 'ab') {
  const aut = new Automaton('starts with ' + word, symbols)
  aut.inLanguage = function (w) {
    return w.startsWith(word)
  }
  aut.addState('0', true)
  ;[...word].forEach((s, i) => {
    aut.addState((i + 1).toString())
    aut.addEdge(i.toString(), (i + 1).toString(), s)
  })
  const finalState = aut.getStateByName(word.length.toString())
    ;[...aut.alphabet.symbols].forEach(s =>
    aut.addEdge(finalState, finalState, s)
  )
  finalState.makeFinal()
  return aut
}

/**
 * construct an automaton for the language of all words that contain a given word
 * @param {string} word - the word to be contained
 * @param {string} [symbols] - the symbols of the alphabet
 * @returns {Automaton} a new automaton
 */

function subword (word, symbols = 'ab') {
  const aut = new Automaton('subword ' + word, symbols)
  aut.inLanguage = function (w) {
    return w.includes(word)
  }
  const q0 = aut.addState('0', true)
    ;[...aut.alphabet.symbols].forEach(s => aut.addEdge(q0, q0, s))
  ;[...word].forEach((s, i) => {
    aut.addState((i + 1).toString())
    aut.addEdge(i.toString(), (i + 1).toString(), s)
  })
  const finalState = aut.getStateByName(word.length.toString())
    ;[...aut.alphabet.symbols].forEach(s =>
    aut.addEdge(finalState, finalState, s)
  )
  finalState.makeFinal()
  return aut
}

/**
 * construct an automaton for the following language: all words w where
 * the number of occurrences of the given symbol divided by the given modulo number
 * results in the given remainder.
 * @param {string} symbol - the symbol to be counted
 * @param {number} remainder - the remainder
 * @param {number} modulo - the modulo number
 * @param {string} [symbols] - the symbols of the alphabet
 * @returns {Automaton} a new automaton
 */
function numberOfSymbols (symbol, remainder, modulo, symbols = 'ab') {
  const aut = new Automaton(
        `|w|${symbol} = ${remainder} mod ${modulo}`,
        symbols
  )
  aut.inLanguage = function (w) {
    return aut.alphabet.numberOf(w, symbol) % modulo === remainder
  }
  for (let i = 0; i < modulo; i++) {
    aut.addState(i.toString(), i === 0)
  }
  for (let i = 0; i < modulo; i++) {
    ;[...aut.alphabet.symbols].forEach(s => {
      if (s === symbol) {
        aut.addEdge(i.toString(), ((i + 1) % modulo).toString(), s)
      } else {
        aut.addEdge(i.toString(), i.toString(), s)
      }
    })
  }
  aut.getStateByName(remainder.toString()).makeFinal()
  return aut
}

/**
 * construct an automaton for the following language: all words w where
 * the length of a word divided by given modulo number
 * results in the given remainder.
 * @param {number} remainder - the remainder
 * @param {number} modulo - the modulo number
 * @param {string} [symbols] - the symbols of the alphabet
 * @returns {Automaton} a new automaton
 */

function modLength (remainder, modulo, symbols = 'ab') {
  const aut = new Automaton(`|w| = ${remainder} mod ${modulo}`, symbols)
  aut.inLanguage = function (w) {
    return w.length % modulo === remainder
  }
  for (let i = 0; i < modulo; i++) {
    aut.addState(i.toString(), i === 0)
  }
  for (let i = 0; i < modulo; i++) {
    ;[...aut.alphabet.symbols].forEach(s => {
      aut.addEdge(i.toString(), ((i + 1) % modulo).toString(), s)
    })
  }
  aut.getStateByName(remainder.toString()).makeFinal()
  return aut
}

/**
 * construct an automatically that has the given number of unreachable states
 * @param {number} count - the number of unreachable states
 * @param {string} [symbols] - the symbols of the alphabet
 * @returns {Automaton} a new automaton
 */
function notReachable (count, symbols = 'ab') {
  const a1 = numberOfSymbols('a', 0, 5, symbols)
  a1.name = 'a1'
  const a2 = numberOfSymbols('a', 0, count, symbols)
  a2.name = 'a2'
  a2.getStartStates().forEach(s => (s.start = false))
  let u = a1.union(a2)
  u.name = 'u'

  const a3 = numberOfSymbols('a', 0, count, symbols)
  a3.name = 'a3'
  a3.getFinalStates().forEach(s => (s.final = false))
  u = u.union(a3)

  u.name = count + ' states not reachable from start and end'
  u.inLanguage = a1.inLanguage
  return u
}

/**
 * construct an automaton suitable for testing the normalize() method
 * @param {string} [symbols] - the symbols of the alphabet
 * @returns {Automaton} a new automaton
 */
function testNormalize (symbols = 'ab') {
  const a = new Automaton('testNormalize', symbols)
  a.addState('1', true)
  a.addState('2', true, true)
  a.addState('3', false, true)
  a.addEdge('1', '3', 'a')
  a.addEdge('1', '2', 'b')
  a.addEdge('2', '3', 'a')
  a.addEdge('3', '2', 'b')
  return a
}

/**
 * construct an automaton that accepts only the empty word.
 * @param {string} [symbols] - the symbols of the alphabet
 * @returns {Automaton} a new automaton
 */
function onlyEmptyWord (symbols = 'ab') {
  const a = new Automaton('empty word', symbols)
  a.addState('1', true, true)
  return a
}

/**
 * construct an automaton that accepts all words.
 * @param {string} [symbols] - the symbols of the alphabet
 * @returns {Automaton} a new automaton
 */
function allWords (symbols = 'ab') {
  const a = new Automaton('all words', symbols)
  const s = a.addState('1', true, true)
  for (const sym of a.alphabet.symbols) {
    a.addEdge(s, s, sym)
  }
  return a
}

/**
 * construct an automaton that accepts no words.
 * @param {string} [symbols] - the symbols of the alphabet
 * @returns {Automaton} a new automaton
 */
function noWords (symbols = 'ab') {
  const a = new Automaton('no words', symbols)
  const s = a.addState('1', true, false)
  for (const sym of a.alphabet.symbols) {
    a.addEdge(s, s, sym)
  }
  return a
}

/**
 * construct an automaton that accepts only the given word.
 * @param {string} w - the word to be accepted
 * @param {string} [symbols] - the symbols of the alphabet
 * @returns {Automaton} a new automaton
 */

function onlyWord (w, symbols = 'ab') {
  const a = new Automaton(w, symbols)
  a.addState('0', true, w === '')
  for (let i = 1; i <= w.length; i++) {
    a.addState(String(i), false, i === w.length)
    a.addEdge(String(i - 1), String(i), w[i - 1])
  }
  a.inLanguage = function (word) {
    return w === word
  }
  return a
}

/**
 * construct an automaton that accepts all words whose length is
 * between min and max.
 * @param {number} min - the minimal length of a word
 * @param {number} max - the maximal length of a word
 * @param {string} [symbols] - the symbols of the alphabet
 * @returns {Automaton} a new automaton
 */
function lengthRange (min, max, symbols = 'ab') {
  const a = new Automaton('length from ' + min + ' to ' + max, symbols)
  for (let i = 0; i <= max + 1; i++) {
    a.addState(String(i), i === 0, i >= min && i <= max)
  }
  for (let i = 0; i <= max; i++) {
    for (const sym of a.alphabet.symbols) {
      a.addEdge(String(i), String(i + 1), sym)
    }
  }
  for (const sym of a.alphabet.symbols) {
    a.addEdge(String(max + 1), String(max + 1), sym)
  }
  a.inLanguage = function (w) {
    return w.length >= min && w.length <= max
  }
  return a
}

/**
 * construct an automaton that accepts all words whose length is
 * at least min.
 * @param {number} min - the minimal length of a word
 * @param {string} [symbols] - the symbols of the alphabet
 * @returns {Automaton} a new automaton
 */
function minLength (min, symbols = 'ab') {
  const a = new Automaton('minimal length of ' + min, symbols)
  for (let i = 0; i <= min; i++) {
    a.addState(String(i), i === 0, i === min)
  }
  for (let i = 0; i < min; i++) {
    for (const sym of a.alphabet.symbols) {
      a.addEdge(String(i), String(i + 1), sym)
    }
  }
  for (const sym of a.alphabet.symbols) {
    a.addEdge(String(min), String(min), sym)
  }
  a.inLanguage = function (w) {
    return w.length >= min
  }
  return a
}

/**
 * construct an automaton that accepts all words whose length is
 * at most max.
 * @param {number} max - the maximal length of a word
 * @param {string} [symbols] - the symbols of the alphabet
 * @returns {Automaton} a new automaton
 */

function maxLength (max, symbols = 'ab') {
  return lengthRange(0, max, symbols)
}

/**
 * construct an automaton suitable for testing the minimize() method.
 *  * @returns {Automaton} a new automaton
 */
function minimize1 () {
  const a = new Automaton('m1')
  a.addState('0', true, false)
  a.addState('1', false, false)
  a.addState('2', false, true)
  a.addState('3', false, true)
  a.addEdge('0', '2', 'a')
  a.addEdge('0', '1', 'b')
  a.addEdge('1', '3', 'a')
  a.addEdge('1', '0', 'b')
  a.addEdge('2', '0', 'a')
  a.addEdge('2', '3', 'b')
  a.addEdge('3', '1', 'a')
  a.addEdge('3', '2', 'b')
  return a
}

module.exports = {
  endsWith,
  startsWith,
  subword,
  numberOfSymbols,
  modLength,
  notReachable,
  testNormalize,
  onlyEmptyWord,
  allWords,
  noWords,
  onlyWord,
  lengthRange,
  minLength,
  maxLength,
  minimize1
}
