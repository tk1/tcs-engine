require('./extendSet')
const State = require('./state')
const Edge = require('./edge')
const Alphabet = require('./alphabet')
const Graph = require('./graph')
const Util = require('./util')
const Vector = require('./vector')
const fs = require('fs')

/** Class representing an automaton. */
class Automaton {
  /**
     * Create an automaton.
     * @param {string} [name] - the name of the automaton.
     * @param {string} [symbols] - the symbols of the input alphabet.
     * @returns {Automaton} new automaton
     */

  constructor (name = 'A', symbols = 'ab') {
    const a = this
    a.name = name
    a.states = new Set()
    a.stateNameMap = new Map()
    a.alphabet = new Alphabet(symbols)
    a.edges = new Set()
    a.deltaMap = new Map()
    a.alphabet.symbols.forEach(s => {
      a.deltaMap.set(s, new Map())
    })
    a.acceptsMemo = memo(Automaton.prototype.accepts)
    a.acceptsMemoMap = memoMap(Automaton.prototype.accepts)
  }

  /**
     * get a state.
     * @param {string} name - the name of a state.
     * @returns {State} the state with the given name or undefined when
     * there is no state with the given name
     */

  getStateByName (name) {
    return this.stateNameMap.get(name)
  }

  /**
     * add a state.
     * @param {string} name - the name of the state.
     * @param {boolean} [start] - true for a start state.
     * @param {boolean} [final] - true for an accepting state.
     * @param {object} [tag] - any additional information the state object should carry
     * @param {boolean} [forceNew] - adds the state with the given name even when a state with the same name already exists.
     * @returns {State} the new state or when forceNew is false and a state with
     * the given name already exists the existing state
     */

  addState (name, start = false, final = false, tag = {}, forceNew = false) {
    const a = this
    if (forceNew) {
      while (a.getStateByName(name) !== undefined) {
        name += 'x'
      }
    }
    let s = a.getStateByName(name)
    if (s !== undefined) {
      return s
    } else {
      s = new State(name, start, final, tag)
      // TODO in constructor?
      s.automaton = a
      a.states.add(s)
      a.stateNameMap.set(name, s)
      return s
    }
  }

  /**
     * delete a state and all edges connected to the state
     * @param {State|string} state - the name of the state or the state object
     */

  deleteState (state) {
    const a = this
    const s = a.getState(state)

    for (const e of s.edgesIn) {
      a.deleteEdge(e)
    }
    for (const e of s.edgesOut) {
      a.deleteEdge(e)
    }
    a.stateNameMap.delete(s.name)
    a.states.delete(s)
  }

  /**
     * get an edge
     * @param {State|string} from - the state where the edge starts
     * @param {State|string} to - the state where the edge ends
     * @param {string} symbol - the symbol the edge carries
     * @returns {Edge} the corresponding edge or undefined if it doesn't exist
     */

  getEdge (from, to, symbol) {
    from = this.getState(from)
    to = this.getState(to)
    for (const e of from.edgesOut) {
      if (e.symbol === symbol && e.sink === to) {
        return e
      }
    }
    return undefined
  }

  /**
     * add an edge
     * @param {State|string} from - the state where the edge starts
     * @param {State|string} to - the state where the edge ends
     * @param {string} symbol - the symbol the edge carries
     * @returns {Edge} the corresponding edge. When the edge already exists the
     * existing edge is returned. Otherwise a new edge will be created and returned.
     */

  addEdge (from, to, symbol) {
    from = this.getState(from)
    to = this.getState(to)
    let e = this.getEdge(from, to, symbol)
    if (e !== undefined) {
      return e
    }
    e = new Edge(from, to, symbol)
    this.edges.add(e)
    if (!this.deltaMap.get(symbol).has(from)) {
      this.deltaMap.get(symbol).set(from, new Set())
    }
    this.deltaMap
      .get(symbol)
      .get(from)
      .add(to)
    e.source.addEdgeOut(e)
    e.sink.addEdgeIn(e)
    return e
  }

  /**
     * delete an edge
     * @param {Edge} e - an existing edge
     */

  deleteEdge (e) {
    const a = this
    a.edges.delete(e)
    a.deltaMap
      .get(e.symbol)
      .get(e.source)
      .delete(e.sink)
    e.source.edgesOut.delete(e)
    e.sink.edgesIn.delete(e)
  }

  /**
     * delete an edge specified by its source and target state and its symbol
     * @param {State|string} from - the state where the edge starts
     * @param {State|string} to - the state where the edge ends
     * @param {string} symbol - the symbol the edge carries
     */

  deleteEdgeFts (from, to, symbol) {
    const a = this
    from = a.getState(from)
    to = a.getState(to)
    const e = a.getEdge(from, to, symbol)
    a.deleteEdge(e)
  }

  /**
     * get a state
     * @param {State|string} s - the name of the state or the state object
     * @returns {State} the corrsponding state or undefined
     */

  getState (s) {
    if (typeof s === 'string') {
      return this.stateNameMap.get(s)
    } else if (s instanceof State) {
      return s
    } else {
      return undefined
    }
  }

  /**
     * the transition function delta
     * @param {State} state - a state
     * @param {string} [symbol] - a symbol. Defaults to all symbols when undefined
     * @returns {Set} a set of all states reachable from state by one transitions
     * with the given symbol(s)
     */

  delta (state, symbol) {
    const a = this
    let symbols
    if (symbol === undefined) {
      symbols = a.alphabet.symbols
    } else {
      symbols = [symbol]
    }

    const d = new Set()
    for (const sym of symbols) {
      if (a.deltaMap.has(sym)) {
        if (a.deltaMap.get(sym).has(state)) {
          a.deltaMap
            .get(sym)
            .get(state)
            .forEach(s => d.add(s))
        }
      }
    }
    return d
  }

  /**
     * get all start states
     * @returns {Set} a set of start states
     */

  getStartStates () {
    return new Set([...this.states].filter(s => s.start))
  }

  /**
     * get all final states
     * @returns {Set} a set of final states
     */

  getFinalStates () {
    return new Set([...this.states].filter(s => s.final))
  }

  /**
     * checks whether the automaton is deterministic
     * @returns {boolean} true if deterministic, false otherwise
     */

  isDeterministic () {
    const a = this
    if (a.getStartStates().size !== 1) {
      return false
    }
    for (const deltaMapSymbol of a.deltaMap.values()) {
      if ([...deltaMapSymbol.values()].some(s => s.size > 1)) {
        return false
      }
    }
    return true
  }

  /**
     * checks whether the automaton is empty (i.e. has no states)
     * @returns {boolean} true if empty, false otherwise
     */

  isEmpty () {
    return this.states.size === 0
  }

  /**
     * the iterated transition function
     * @param {Set} currentStates - a set of states
     * @param {string} word - an input word
     * @returns {Set} the set of all states which are reached from the given states by
     * reading the given word.
     */

  deltaStar (currentStates, word) {
    const a = this

    /* TODO optimize
            if (a.isDeterministic()) {
                var start = a.getStartStates()[0]
                var state = [...word].reduce((state, symbol) => [...a.delta(state,symbol)][0], start)
                return state.final
            }
            */

    for (const symbol of [...word]) {
      const nextStates = new Set()
      for (const from of currentStates) {
        for (const to of a.delta(from, symbol)) {
          nextStates.add(to)
        }
      }
      if (nextStates.size === 0) {
        return nextStates // empty set
      }
      currentStates = nextStates
    }
    return currentStates
  }

  /**
     * determines whether a word is accepted or not
     * @param {string} word - an input word
     * @returns {boolean} true when the word is accepted, false otherwise
     */

  accepts (word) {
    const a = this
    if (a.isEmpty()) {
      return false
    }
    return [...a.deltaStar(a.getStartStates(), word)].some(s => s.final)
  }

  /**
     * convert the automaton to a string
     * @return {string} a string representing the automaton
     */

  toString () {
    const a = this
    let s = ''
    const nl = '\n'
    s += a.name + nl
    s += 'symbols: '
    s += a.alphabet.symbols.join(',')
    s += nl

    s += 'states: ' + [...a.states].map(s => s.toString()).join(nl) + nl
    s += 'edges:' + nl + [...a.edges].map(e => e.name).join(nl) + nl

    return s
  }

  /**
     * TODO
     * @param {string} lines
     * @returns {string} TODO
     */

  build (lines) {
    const a = this

    let first = true
    let x = 1
    let y = 1

    function transformCoordinates (p) {
      return new Vector(100 * p.x, 100 * p.y)
    }

    for (let i = 0; i < lines.length; i++) {
      lines[i] = lines[i].replace('\r', '')
      if (lines[i] === '') {
        continue
      }
      if (lines[i][0] === '-') {
        x = 1
        y++
        continue
      }
      if (lines[i].match('final:')) {
        const f = lines[i].split(':')
        const states = f[1].split(',')
        states.forEach(s => a.getState(s).makeFinal())
        continue
      }
      const edge = lines[i].split('-')
      const symbols = edge[1].split(',')
      let sourceName = edge[0]
      if (sourceName.match(/\(/)) {
        const res = sourceName.match(/(.*)\((.*),(.*)\)/)
        sourceName = res[1]
        x = res[2]
        y = res[3]
      }
      let source = a.getStateByName(sourceName)
      if (source === undefined) {
        source = a.addState(
          sourceName,
          first,
          false
        )
        console.log(sourceName)
        source.position = transformCoordinates({ x: x++, y: y })
      } else {
        if (source.position === undefined) {
          console.log(sourceName)
          source.position = transformCoordinates({ x: x++, y: y })
        }
      }
      const sink = a.addState(edge[2])
      symbols.forEach(s => {
        a.addEdge(source, sink, s)
      })
      if (first) {
        first = false
      }
    }
    a.setLabelledEdges()
    let i = 0
    a.states.forEach(s => { s.number = i++ })
  }

  /**
     * convert automaton to JSON format
     * @returns {string} a JSON representation of the automaton.
     */

  toJSON () {
    const a = this
    const states =
            '"states": [' +
            [...a.states]
              .map(s => {
                return (
                        `{"name": "${s.name}"` +
                        (s.start ? ', "start": "true"' : '') +
                        (s.final ? ', "final": "true"' : '') +
                        '}'
                )
              })
              .join(',\n') +
            ']'
    const edges =
            '"edges": [' +
            [...a.edges]
              .map(
                e =>
                        `{"from": "${e.source.name}", "to": "${e.sink.name}", "symbol": "${
                        e.symbol
                        }" }`
              )
              .join(',\n') +
            ']'
    return `{ ${states},\n ${edges}\n }`
  }

  convertHaskell () {
    const a = this.numberStatesDFS()
    let out = 'A {final = ['
    const states = [...a.states]

    out += states
      .filter(s => s.final)
      .map(s => s.number.toString())
      .join(',')
    out += '], edges = ['
    out += [...a.edges]
      .map(edge => `(${edge.source.number},'${edge.symbol}',${edge.sink.number})`)
      .join(',')

    out += ']}'

    return out
  }

  /**
     * convert automaton to Tikz format
     * @returns {string} a Tikz representation of the automaton.
     */

  convertTikz () {
    const a = this
    const out = []
    const scale = 1 / 50

    const states = [...a.states]
    const maxY = Math.max.apply(Math, states.map(s => s.position.y))

    for (const state of a.states) {
      state.pos = state.position.transform(scale, maxY)
    }
    a.labelledEdges.forEach(edge => {
      edge.cp1.pos = edge.cp1.transform(scale, maxY)
      edge.cp2.pos = edge.cp2.transform(scale, maxY)
    })

    out.push(
      "\\begin{tikzpicture}[->,>=stealth',initial text={},shorten >=1pt,auto,node distance=2.5cm, semithick,auto]"
    )
    out.push('\\tikzstyle{every state}=[fill=white,draw=black,text=black]')

    for (const state of a.states) {
      let s = '\\node[state'
      if (state.start) {
        s += ',initial'
      }
      if (state.final) {
        s += ',accepting'
      }
      s += '] ('
      const position = `at ${state.pos.toString()}`

      s += state.number + ') ' + position + ' {$' + state.name + '$};'
      out.push(s)
    }

    a.labelledEdges.forEach(edge => {
      out.push(
                `\\draw (${
                edge.source.number
                }) .. controls ${edge.cp1.pos.toString()} and ${edge.cp2.pos.toString()} .. node {$${edge.symbols.join(
                    ','
                )}$} (${edge.sink.number});`
      )
    })

    out.push('\\end{tikzpicture}')
    return out
  }

  /**
     * constructs a deterministic version of the automaton
     * @param {boolean} [renameStates] - if true the states are renamed to reduce memory usage
     * @returns {Automaton} a new deterministic automaton that is equivalent to the given automaton.
     */

  makeDeterministic (renameStates = true) {
    if (this.isEmpty()) {
      return this.reduce()
    }
    let nfa
    if (renameStates) {
      // necessary to reduce space for long state names
      nfa = this.reduce().renameStates()
    } else {
      nfa = this
    }
    if (nfa.isDeterministic()) {
      return nfa
    }
    const dfa = new Automaton(nfa.name + '-dfa', nfa.alphabet.symbols.join(''))
    dfa.inLanguage = nfa.inLanguage

    const startStateSet = nfa.getStartStates()
    const startState = dfa.addState(
      startStateSet.name(),
      true,
      [...startStateSet].some(s => s.final),
      { stateSet: startStateSet }
    )

    const todoStates = new Set([startState])

    while (todoStates.size > 0) {
      let nextState
      const currentState = todoStates.values().next().value
      todoStates.delete(currentState)
      nfa.alphabet.symbols.forEach(s => {
        const nextStatesSet = nfa.deltaStar(currentState.tag.stateSet, s)
        nextState = dfa.getStateByName(nextStatesSet.name())
        // TODO not ok to check by name
        if (nextState === undefined) {
          nextState = dfa.addState(
            nextStatesSet.name(),
            false,
            [...nextStatesSet].some(s => s.final),
            { stateSet: nextStatesSet }
          )
          todoStates.add(nextState)
        }
        dfa.addEdge(currentState, nextState, s)
      })
    }

    return dfa
  }

  /**
     * construct the union of the given automaton and a second one
     * @param {Automaton} a2 - a second automaton
     * @returns {Automaton} a new automaton that accepts the union of the
     * languages of the given and the second automaton.
     */

  union (a2) {
    const a1 = this
    const u = new Automaton('union of ' + a1.name + ' and ' + a2.name)

    u.inLanguage = function (w) {
      return a1.inLanguage(w) || a2.inLanguage(w)
    }

    // TODO why? semicolon is necessary because next line begins with []
    ;[a1, a2].forEach(a =>
      a.states.forEach(s => u.addState(a.name + ':' + s.name, s.start, s.final))
    )
    ;[a1, a2].forEach(a =>
      a.edges.forEach(e =>
        u.addEdge(a.name + ':' + e.source.name, a.name + ':' + e.sink.name, e.symbol)
      )
    )

    return u
  }

  /**
     * create a copy of the automaton
     * @returns {Automaton} a new automaton that is a copy of the given automaton.
     */

  copy () {
    const a = this
    const ac = new Automaton('copy of ' + a.name, a.alphabet.symbols.join(''))

    ac.inLanguage = a.inLanguage

    a.states.forEach(s => ac.addState(s.name, s.start, s.final, s.tag))
    a.edges.forEach(e => ac.addEdge(e.source.name, e.sink.name, e.symbol))

    return ac
  }

  /**
     * construct an automaton that accepts the reversal of the language accepted by
     * the given automaton. All edges are reversed. Initial states become final states.
     * Final states become initial states.
     * @returns {Automaton} a new automaton that accepts the reversal of the language accepted by
     * the given automaton.
     */

  reverse () {
    const a = this
    const ar = new Automaton('reverse of ' + a.name, a.alphabet.symbols.join(''))

    ar.inLanguage = function (w) {
      return a.inLanguage(
        w
          .split('')
          .reverse()
          .join('')
      )
    }
    a.states.forEach(s => ar.addState(s.name, s.final, s.start, s.tag))
    a.edges.forEach(e => ar.addEdge(e.sink.name, e.source.name, e.symbol))

    return ar
  }

  /**
     * construct an automaton that is a reduced version of the given automaton.
     * The new automaton contains only necessary states.
     * @returns {Automaton} a reduced automaton
     */

  reduce () {
    const a = this
    const ar = new Automaton('reduced of ' + a.name, a.alphabet.symbols.join(''))
    ar.inLanguage = a.inLanguage

    if (a.states.size === 0 || a.getStartStates().size === 0 || a.getFinalStates().size === 0) {
      return ar
    }

    if (a.normalized) {
      ar.normalized = true
      ar.emptyWordAccepted = a.emptyWordAccepted
    }

    const aRev = a.reverse()

    Graph.dfs(a.states, a.getStartStates())
    Graph.dfs(aRev.states, aRev.getStartStates())

    a.states.forEach(s => {
      if (s.marked && aRev.getStateByName(s.name).marked) {
        ar.addState(s.name, s.start, s.final, s.tag)
      }
    })
    a.edges.forEach(e => {
      if (
        e.source.marked &&
                e.sink.marked &&
                aRev.getStateByName(e.source.name).marked &&
                aRev.getStateByName(e.sink.name).marked
      ) { ar.addEdge(e.source.name, e.sink.name, e.symbol) }
    })

    return ar
  }

  /**
     * construct the concatenation of the given automaton and a second one
     * @param {Automaton} a2 - a second automaton
     * @returns {Automaton} a new automaton that accepts the concatenation of the
     * languages of the given and the second automaton.
     */

  concat (a2) {
    const a1 = this

    if (a1.name === a2.name) {
      // TODO untersuchen, ob namen vermieden werden können
      a1.name += '1'
      a2.name += '2'
    }

    let ac = new Automaton('concatenation of ' + a1.name + ' and ' + a2.name)

    ac.inLanguage = function (w) {
      for (let i = 0; i <= w.length; i++) {
        if (a1.inLanguage(w.substring(0, i)) && a2.inLanguage(w.substring(i))) {
          return true
        }
      }
      return false
    }

    a1.states.forEach(s => ac.addState(a1.name + ':' + s.name, s.start, false))
    a2.states.forEach(s => ac.addState(a2.name + ':' + s.name, false, s.final))
    ;[a1, a2].forEach(a =>
      a.edges.forEach(e =>
        ac.addEdge(a.name + ':' + e.source.name, a.name + ':' + e.sink.name, e.symbol)
      )
    )
    a1.getFinalStates().forEach(f => {
      a2.getStartStates().forEach(s => {
        s.edgesOut.forEach(e => {
          ac.addEdge(a1.name + ':' + f.name, a2.name + ':' + e.sink.name, e.symbol)
        })
      })
    })

    if (a1.acceptsEmptyWord()) {
      ac = ac.union(a2)
    }
    if (a2.acceptsEmptyWord()) {
      ac = ac.union(a1)
    }
    if (a1.acceptsEmptyWord() && a2.acceptsEmptyWord()) {
      const ew = new Automaton('empty word')
      ew.addState('1', true, true)
      ac = ac.union(ew)
    }

    return ac
  }

  /**
     * check whether the empty word is accepted
     * @returns {boolean} true if the empty word is accepted, false otherwise
     */

  acceptsEmptyWord () {
    return [...this.getStartStates()].reduce((accepts, state) => accepts || state.final, false)
    /*
        for (let state of [...this.getStartStates()]) {
            if (state.final)
                return true
        }
        return false
        */
  }

  /**
     * construct a normalized version of the given automaton.
     * @returns {Automaton} a new normalized automaton that is equivalent to the given automaton.
     */

  normalize () {
    const a = this
    let aResult = a.reduce()
    if (aResult.isEmpty()) {
      return aResult
    }

    const startStates = [...aResult.getStartStates()]
    aResult.emptyWordAccepted = aResult.acceptsEmptyWord()
    if (startStates.length > 1 || startStates[0].edgesIn.size > 0) {
      const newStartState = aResult.addState('start', true, false, {}, true)
      startStates.forEach(s => {
        s.start = false
        s.edgesOut.forEach(e => {
          aResult.addEdge(newStartState, e.sink, e.symbol)
        })
      })
    }

    const finalStates = [...aResult.getFinalStates()]
    if (finalStates.length > 1 || finalStates[0].edgesOut.size > 0) {
      const newFinalState = aResult.addState('final', false, true, {}, true)
      finalStates.forEach(s => {
        s.final = false
        s.edgesIn.forEach(e => {
          aResult.addEdge(e.source, newFinalState, e.symbol)
        })
      })
    }

    aResult.normalized = true
    aResult = aResult.reduce()
    // TODO empty word?
    aResult.inLanguage = a.inLanguage
    aResult.name = 'normalized ' + a.name
    return aResult
  }

  /**
     * minimize the given automaton
     * @param {string} [algorithm] - the name of the algorithm to use (Hopcroft or Brzozowski)
     * @returns {Automaton} a new minimal automaton that is equivalent to the given automaton.
     */

  minimize (algorithm = 'Hopcroft') {
    if (algorithm === 'Brzozowski') {
      return this.minimizeBrzozowski()
    } else {
      return this.minimizeHopcroft()
    }
  }

  /**
     * minimize the given automaton by using Brzozowski's algorithm
     * @returns {Automaton} a new minimal automaton that is equivalent to the given automaton.
     */

  minimizeBrzozowski () {
    const a = this
    const aResult = a
      .reverse()
      .makeDeterministic()
      .reverse()
      .makeDeterministic()
      .complete()
    aResult.name = 'minimized ' + a.name
    aResult.inLanguage = a.inLanguage
    return aResult
  }

  /**
     * adds the property statesInBySymbol to each state. statesInBySymbol is a map that
     * maps a symbol to all states from which the given state is reachable via one edge
     * labelled with that symbol.
     * @returns {null}
     */

  calcStatesInBySymbol () {
    const a = this
    for (const state of a.states) {
      state.statesInBySymbol = new Map()
      a.alphabet.symbols.forEach(c => {
        state.statesInBySymbol.set(c, new Set())
      })
      for (const edge of state.edgesIn) {
        state.statesInBySymbol.get(edge.symbol).add(edge.source)
      }
    }
  }

  /**
     * minimize the given automaton by using Hopcroft's algorithm.
     * see {@link https://arxiv.org/pdf/1010.5318v3.pdf Berstel et al., figure 3 on page 9}.
     * @returns {Automaton} a new minimal automaton that is equivalent to the given automaton.
     */

  minimizeHopcroft () {
    // var a = this.makeDeterministic().complete().renameStatesDFS()
    const a = this.reduce()
      .makeDeterministic()
      .renameStatesDFS()
      .complete()
    if (a.states.size < 2) {
      return a
    }
    a.calcStatesInBySymbol()
    const finalStates = a.getFinalStates()
    const nonFinalStates = a.states.difference(finalStates)
    let partition = new Set([finalStates, nonFinalStates])
    const minSet = finalStates.size < nonFinalStates.size ? finalStates : nonFinalStates
    if (minSet.size !== 0) {
      let waitingSetSize = 0
      const waitingMap = new Map()
      waitingMap.toString = function () {
        let s = ''
        s += `size: ${waitingSetSize}\n`
        for (const [k, v] of this) {
          s += k + ': '
          for (const set of v) {
            s += ' ' + set.name()
          }
          s += '\n'
        }
        return s
      }

      a.alphabet.symbols.forEach(c => {
        waitingMap.set(c, new Set())
        waitingMap.get(c).add(minSet)
        waitingSetSize++
      })
      // console.log('partition: ' + partition.name())
      // console.log(waitingMap.toString())
      let splitterChar
      let splitterSet

      while (waitingSetSize > 0) {
        for (let i = 0; i < a.alphabet.symbols.length; i++) {
          const c = a.alphabet.symbols[i]
          if (waitingMap.get(c).size > 0) {
            splitterSet = [...waitingMap.get(c)][0]
            waitingMap.get(c).delete(splitterSet)
            splitterChar = c
            waitingSetSize--
            break // for
          }
        }
        // console.log(waitingMap.toString())
        const newPartition = new Set()
        for (const part of partition) {
          let splitter = new Set()
          for (const state of splitterSet) {
            splitter = splitter.union(state.statesInBySymbol.get(splitterChar))
          }
          const part1 = part.intersect(splitter)
          const part2 = part.difference(splitter)
          if (part1.size === 0 || part2.size === 0) {
            newPartition.add(part)
            continue
          }
          newPartition.add(part1)
          newPartition.add(part2)
          const minPart = part1.size < part2.size ? part1 : part2
          for (let i = 0; i < a.alphabet.symbols.length; i++) {
            const wm = waitingMap.get(a.alphabet.symbols[i])
            let found = false
            for (const existingPart of wm) {
              if (existingPart.equals(part)) {
                wm.delete(existingPart)
                wm.add(part1)
                wm.add(part2)
                found = true
                break
              }
            }
            if (!found) {
              wm.add(minPart)
            }
            waitingSetSize++
          }
          // console.log(waitingMap.toString())
        }
        partition = newPartition
        // console.log('partition: ' + partition.name())
      }
    }
    // merge
    const aResult = new Automaton('minimized ' + a.name, a.alphabet.symbols.join(''))

    for (const part of partition) {
      let isStart = false
      let isFinal = false
      for (const state of part) {
        part.representativeState = state
        isStart |= state.start
        isFinal |= state.final
        state.part = part
      }
      aResult.addState(part.name(), isStart, isFinal)
    }

    for (const part of partition) {
      for (let i = 0; i < a.alphabet.symbols.length; i++) {
        const c = a.alphabet.symbols[i]
        const dmc = a.deltaMap.get(c)
        if (dmc.size > 0 && dmc.get(part.representativeState)) {
          const toState = [...a.deltaMap.get(c).get(part.representativeState)][0]
          aResult.addEdge(part.name(), toState.part.name(), c)
        }
      }
    }

    aResult.inLanguage = a.inLanguage
    return aResult.complete()
  }

  /**
     * construct a complete version of the given automaton
     * @returns {Automaton} a new complete automaton that is equivalent to the given automaton.
     */

  complete () {
    const a = this
    const aResult = a.reduce()
    if (aResult.states.size === 0) {
      const startState = aResult.addState('0', true)
      for (const s of aResult.alphabet.symbols) {
        aResult.addEdge(startState, startState, s)
      }
      return aResult
    }

    let errorState
    for (const s of aResult.states) {
      for (const sym of aResult.alphabet.symbols) {
        if (aResult.delta(s, sym).size === 0) {
          if (errorState === undefined) {
            errorState = aResult.addState('err')
            for (const se of aResult.alphabet.symbols) {
              aResult.addEdge(errorState, errorState, se)
            }
          }
          aResult.addEdge(s, errorState, sym)
        }
      }
    }
    return aResult
  }

  /**
     * construct an automaton that accepts the complement of the language of the given
     * automaton.
     * @returns {Automaton} a new automaton that accepts the complement of the language of the given
     * automaton.
     */

  complement () {
    const a = this
    const aResult = a.minimize().complete()
    aResult.states.forEach(s => (s.final = !s.final))
    aResult.name = 'complement of ' + a.name
    aResult.inLanguage = function (w) {
      return !a.inLanguage(w)
    }
    return aResult
  }

  /**
     * construct the difference of the given automaton and a second one
     * @param {Automaton} a2 - a second automaton
     * @returns {Automaton} a new automaton that accepts the difference of the
     * languages of the given and the second automaton, i.e. all words that
     * are accepted by the given automaton, but not by the second automaton.
     */

  difference (a2) {
    const a1 = this
    const aResult = a1.intersect(a2.complement())
    return aResult
  }

  /**
     * construct an automaton that accepts the star of the language of the given
     * automaton.
     * @returns {Automaton} a new automaton that accepts the star of the language of the given
     * automaton.
     */

  star () {
    const a = this
    let aResult = a.reduce()

    aResult.emptyWordAccepted = true

    const startStates = [...aResult.getStartStates()]
    const finalStates = [...aResult.getFinalStates()]

    /* must be defined after startStates and finalStates in order to be not included in these sets */
    const newStartFinalState = aResult.addState('startfinal', true, true, {}, true)

    startStates.forEach(s => {
      s.start = false
      s.edgesOut.forEach(e => {
        aResult.addEdge(newStartFinalState, e.sink, e.symbol)
      })
    })

    finalStates.forEach(s => {
      s.final = false
      s.edgesIn.forEach(e => {
        aResult.addEdge(e.source, newStartFinalState, e.symbol)
      })
    })

    aResult = aResult.reduce()
    // aResult.inLanguage = a.inLanguage
    aResult.name = 'star ' + a.name
    return aResult
  }

  /**
     * rename a state
     * @param {State} s - the state to be renamed
     * @param {*} newName - the new name
     */

  renameState (s, newName) {
    // TODO setter
    // TODO overwrite possible, ok if renaming all
    const a = this
    a.stateNameMap.delete(s.name)
    s.name = newName
    a.stateNameMap.set(s.name, s)
  }

  /**
     * rename all states. If the permutation is undefined the states will
     * be renamed to their consecutive number. Otherwise the permutation gives
     * the order of the renaming.
     * @param {Array} [permutation] undefined or an array whose length is the
     * number of states. Each entry is the number of state.
     * @returns {Automaton} the given automaton with the renamed states
     */

  renameStates (permutation) {
    const a = this
    if (permutation !== undefined && permutation.length !== a.states.size) {
      throw new Error('permutation error')
    }
    ;[...a.states].forEach((s, i) => {
      if (permutation === undefined) {
        a.renameState(s, String(i))
      } else {
        a.renameState(s, String(permutation[i]))
      }
    })
    return a
  }

  /**
     * rename all states. Each state is renamed to the number in which it appears
     * in a depth first search of the graph of the automaton.
     * The names are Base62 (0-9, A-Z, a-z) encoded.
     * @returns {Automaton} the given automaton with the renamed states
     */

  renameStatesDFS () {
    // var aResult = this.reduce()
    const a = this
    if (a.states.size === 0) {
      return a
    }
    const totalDigits = Math.floor(Math.log(a.states.size) / Math.log(62)) + 1
    let count = 0
            ;[...a.states].forEach(s => (s.marked = false))

    function dfs (s) {
      s.marked = true
      a.renameState(s, Util.toBase62(count++, totalDigits))
      ;[...s.edgesOut].sort(Edge.compareBySymbol).forEach(e => {
        if (!e.sink.marked) {
          dfs(e.sink)
        }
      })
    }
    if ([...a.getStartStates()].length === 0) {
      throw new Error('renameStatesDFS: no start states')
    }
    dfs([...a.getStartStates()][0])
    return a
  }

  numberStatesDFS () {
    const a = this
    if (a.states.size === 0) {
      return a
    }
    let count = 0
            ;[...a.states].forEach(s => (s.marked = false))

    function dfs (s) {
      s.marked = true
      s.number = count++
      ;[...s.edgesOut].sort(Edge.compareBySymbol).forEach(e => {
        if (!e.sink.marked) {
          dfs(e.sink)
        }
      })
    }
    if (a.getStartStates().size === 0) {
      throw new Error('numberStatesDFS: no start states')
    }
    dfs([...a.getStartStates()][0])
    return a
  }

  /**
     * determines the signature of the given automaton that is obtained when renaming
     * states in DFS order (see {@link Automaton#renameStatesDFS}).
     * @returns {string} the signature of the automaton
     */

  signatureDFS () {
    const aResult = this.renameStatesDFS()
    if (!aResult.isDeterministic()) {
      return undefined
    }
    let signature = ''
    let final = ''
    const symbols = aResult.alphabet.symbols
            ;[...aResult.states].sort(State.compareByName).forEach(s => {
      final += s.final ? '1' : '0'
      for (const sym of symbols) {
        let successor = '-'
                        ;[...s.edgesOut].forEach(e => {
          if (e.symbol === sym) {
            successor = e.sink.name
          }
        })
        signature += successor
      }
    })
    return signature + '|' + final + '|' + aResult.alphabet.symbols.join('')
  }

  signatureNumberedDFS () {
    const a = this
    if (!a.isDeterministic()) {
      return undefined
    }
    a.numberStatesDFS()
    let signature = ''
    let final = ''
    const symbols = a.alphabet.symbols
    const totalDigits = Math.floor(Math.log(a.states.size) / Math.log(62)) + 1
            ;[...a.states].sort((s1, s2) => s1.number - s2.number).forEach(s => {
      final += s.final ? '1' : '0'
      for (const sym of symbols) {
        let successor = '-'
                        ;[...s.edgesOut].forEach(e => {
          if (e.symbol === sym) {
            successor = Util.toBase62(e.sink.number, totalDigits)
          }
        })
        signature += successor
      }
    })
    return signature + '|' + final + '|' + a.alphabet.symbols.join('')
  }

  /**
     * checks whether the given automaton is equivalent to a second automaton
     * @param {Automaton} a2 - the second automaton
     * @returns {boolean} true if the two automata are equivalent, false otherwise.
     */

  equivalent (a2) {
    return this.minimize().signatureDFS() === a2.minimize().signatureDFS()
  }

  /**
     * construct the intersection of the given automaton and a second one
     * @param {Automaton} a2 - a second automaton
     * @returns {Automaton} a new automaton that accepts the intersection of the
     * languages of the given and the second automaton.
     */

  intersect (a2) {
    const a1 = this
    const aResult = new Automaton('intersection of ' + a1.name + ' and ' + a2.name)

    aResult.inLanguage = function (w) {
      return a1.inLanguage(w) && a2.inLanguage(w)
    }

    for (const s1 of a1.states) {
      for (const s2 of a2.states) {
        aResult.addState(
          s1.name + ',' + s2.name,
          s1.start && s2.start,
          s1.final && s2.final
        )
      }
    }
    for (const e1 of a1.edges) {
      for (const e2 of a2.edges) {
        if (e1.symbol === e2.symbol) {
          aResult.addEdge(
            aResult.getStateByName(e1.source.name + ',' + e2.source.name),
            aResult.getStateByName(e1.sink.name + ',' + e2.sink.name),
            e1.symbol
          )
        }
      }
    }
    return aResult
  }

  /**
     * a generator that returns the accepted words of the given automaton up to the given
     * maximal length.
     * @param {number} maxLength - the maximal length of generated words
     * @returns {string} the next accepted word
     */

  * acceptedWords (maxLength) {
    const a = this
    const words = a.alphabet.genAllWords()
    let w
    while ((w = words.next().value).length <= maxLength) {
      if (a.accepts(w)) {
        yield w
      }
    }
  }

  /**
     * checks whether the automaton accepts all words
     * @returns {boolean} true if the automaton accepts every word, false otherwise
     */

  acceptsAllWords () {
    const a = this.minimize()
    return a.states.size === 1 && a.getStartStates().size === 1 && a.getFinalStates().size === 1
  }

  /**
     * checks whether the automaton accepts no word
     * @returns {boolean} true if the automaton accepts no word, false otherwise
     */

  acceptsNoWords () {
    return this.complement().acceptsAllWords()
  }

  /**
     * determine the first word in lexiographical order that the automaton accepts
     * @param {maxLength} check only words up to this length
     * @returns {string} the first accepted word or null if none was found
     */

  firstAcceptedWord (maxLength = 10) {
    // TODO not optimal, optimize with shortest path from initial to final
    const a = this
    if (a.acceptsNoWords()) {
      return null
    }
    return a.acceptedWords(maxLength).next()
  }

  /**
     * construct an automaton from a given signature
     * @param {string} signature
     * @returns {Automaton} a new automaton with the given signature
     */

  static constructFromSignature (signature) {
    const parts = signature.split('|')
    if (parts.length !== 3) {
      throw new Error('there must be exactly 3 parts')
    }
    const transitions = parts[0]
    const finals = parts[1]
    const symbols = parts[2]

    if (transitions.length === 0 || finals.length === 0 || symbols.length === 0) {
      throw new Error('empty part not allowed')
    }
    const numberStates = finals.length
    const digitsPerState = Math.floor(Math.log(numberStates) / Math.log(62)) + 1
    if (digitsPerState * numberStates * symbols.length !== transitions.length) {
      throw new Error('wrong signature length')
    }

    const aResult = new Automaton('signature ' + signature, symbols)
    for (let i = 0; i < numberStates; i++) {
      aResult.addState(Util.toBase62(i, digitsPerState), i === 0, finals[i] === '1')
    }
    for (let i = 0; i < numberStates; i++) {
      for (let j = 0; j < symbols.length; j++) {
        const to = transitions.substr(
          digitsPerState * (i * symbols.length + j),
          digitsPerState
        )
        if (to[0] !== '-' && Util.fromBase62(to) < numberStates) {
          aResult.addEdge(Util.toBase62(i, digitsPerState), to, symbols[j])
        }
      }
    }
    return aResult
  }

  /**
     * calculate the similarity of the given automaton and a second one. The similarity is the
     * ratio of the number of words which both automata accept or accept not to the number of
     * all words up to a given length.
     * @param {Automaton} a2 - the second automaton
     * @param {number} maxLength - the maximal length of words to be considered
     * @returns {number} the similarity ratio with nominator and denominator
     */

  similarity (a2, maxLength) {
    const a1 = this
    const words = a1.alphabet.genAllWords()
    let w
    let count = 0
    let correct = 0
    while ((w = words.next().value).length <= maxLength) {
      count++
      if (a1.accepts(w) === a2.accepts(w)) {
        correct++
      }
    }
    return { correct: correct, count: count }
  }

  /**
     * determines whether the given automaton is isomorphic to a second automaton.
     * @param {Automaton} a2 - the second automaton
     * @returns {boolean} true when both automata are isomorphic, false otherwise
     */

  isomorphic (a2) {
    const a1 = this
    if (
      a1.states.size !== a2.states.size ||
            a1.edges.size !== a2.edges.size ||
            a1.getStartStates().size !== a2.getStartStates().size ||
            a1.getFinalStates().size !== a2.getFinalStates().size ||
            a1.alphabet.symbols.sort().join('') !== a2.alphabet.symbols.sort().join('')
    ) {
      return false
    }
    // TODO equivalent ?

    const states1 = [...a1.states]
    const states2 = [...a2.states]
    states1.forEach((s, i) => (s.index = i))
    states2.forEach((s, i) => (s.index = i))

    const numberStates = a1.states.size

    function checkIso (p) {
      for (let i = 0; i < numberStates; i++) {
        if (
          states1[i].start !== states2[p[i]].start ||
                    states1[i].final !== states2[p[i]].final
        ) {
          return false
        }
      }
      for (const e of a1.edges) {
        const f2 = states2[p[e.source.index]]
        const t2 = states2[p[e.sink.index]]
        if (a2.getEdge(f2, t2, e.symbol) === undefined) {
          return false
        }
      }
      return true
    }

    const perms = Util.permutations(numberStates)
    let p
    let result = false
    while ((p = perms.next().value) !== undefined) {
      if (checkIso(p)) {
        console.log(p.join(' ') + '<')
        result = true
        // return p
      }
    }
    return result
  }

  /**
     * determines whether the given automaton is isomorphic to a second automaton.
     * This a a optimized version of {@link Automaton#isomorphic}.
     * @param {Automaton} a2 - the second automaton
     * @returns {boolean} true when both automata are isomorphic, false otherwise
     */

  isomorphicOpt (a2) {
    const a1 = this
    if (
      a1.states.size !== a2.states.size ||
            a1.edges.size !== a2.edges.size ||
            a1.getStartStates().size !== a2.getStartStates().size ||
            a1.getFinalStates().size !== a2.getFinalStates().size ||
            a1.alphabet.symbols.sort().join('') !== a2.alphabet.symbols.sort().join('')
    ) {
      return false
    }
    // TODO equivalent ?

    a1.states.forEach((s, i) => (s.index = i))
    a2.states.forEach((s, i) => (s.index = i))
    const states1 = [...a1.states]
    const states2 = [...a2.states]

    const numberStates = a1.states.size

    // TODO not finished
    function checkIso (permutation) {
      for (let i = 0; i < numberStates; i++) {
        if (permutation[i] !== undefined) {
          const s1 = states1[i]
          const s2 = states2[permutation[i]]
          for (const sym of a1.alphabet.symbols) {
            const succ1 = a1.delta(s1, sym)
            const succ2 = a2.delta(s2.sym)
            if (succ1.size !== succ2.size) {
              return false
            }
          }
        }
      }
      return true
    }

    const perms = Util.permutations(a1.getStartStates().size)
    let p
    while ((p = perms.next().value) !== undefined) {
      if (checkIso(p)) {
        return p
      }
    }
    return false
  }

  static readFromFile (fileName) {
    return new Promise(function (resolve, reject) {
      fs.readFile(fileName, function (err, data) {
        if (err) {
          reject(err)
          return
        }
        const lines = data.toString().split('\n')
        const aResult = new Automaton()
        aResult.build(lines)
        resolve(aResult)
      })
    })
  }

  setLabelledEdges (coordinatesEdges) {
    const a = this
    const edges = a.labelledEdgesAsMap()
    const edgesArray = []
    let count = 0

    const layoutEdges = coordinatesEdges || []
    edges.forEach((toMap, from) => {
      toMap.forEach((symbols, to) => {
        let layoutEdge = layoutEdges.find(e => {
          return e.source === from.number && e.sink === to.number
        })
        if (layoutEdge === undefined) {
          layoutEdge = {}
        }
        edgesArray.push({
          id: `e${count++}`,
          source: from,
          sink: to,
          symbols: [...symbols],
          existsReversedEdge: false,
          cp1: Vector.fromPoint(layoutEdge.cp1),
          cp2: Vector.fromPoint(layoutEdge.cp2)
        })
      })
    })
    edgesArray.forEach(e => {
      if (e.cp1) {
        e.cp1.edge = e
      }
      if (e.cp2) {
        e.cp2.edge = e
      }
      if (e.source !== e.sink && edges.has(e.sink) && edges.get(e.sink).has(e.source)) {
        e.existsReversedEdge = true
      }
    })
    a.labelledEdges = edgesArray
  }

  setLayout (layout) {
    const a = this
    if (!a.signature) {
      a.signature = a.signatureNumberedDFS()
    }
    /*
        if (a.signature !== layout.signature) {
            throw 'setLayout: wrong signature'
        }
        */
    a.states.forEach(s => {
      s.position = new Vector(
        layout.coordinatesStates[s.number].x,
        layout.coordinatesStates[s.number].y
      )
    })
    a.setLabelledEdges(layout.coordinatesEdges)
  }

  labelledEdgesAsMap () {
    // detect parallel edges and make one edge out of them
    const a = this
    const edges = new Map()
            ;[...a.edges].forEach(e => {
      const from = e.source
      const to = e.sink
      if (edges.has(from)) {
        if (edges.get(from).has(to)) {
          edges
            .get(from)
            .get(to)
            .add(e.symbol)
        } else {
          edges.get(from).set(to, new Set([e.symbol]))
        }
      } else {
        const toMap = new Map()
        toMap.set(to, new Set([e.symbol]))
        edges.set(from, toMap)
      }
    })
    return edges
  }
}

/**
 * memoizes a function by using an opbject
 * @param {Function} f - the function to be memoized
 * @returns {Function} the memoized function
 */

function memo (f) {
  const cache = Object.create(null)
  return function () {
    const key = arguments[0]
    if (key in cache) {
      return cache[key]
    } else {
      return (cache[key] = f.apply(this, arguments))
    }
  }
}

/**
 * memoizes a function by using a map
 * @param {Function} f - the function to be memoized
 * @returns {Function} the memoized function
 */

function memoMap (f) {
  const cache = new Map()
  return function () {
    const key = arguments[0]
    if (cache.has(key)) {
      return cache.get(key)
    } else {
      const value = f.apply(this, arguments)
      cache.set(key, value)
      return value
    }
  }
}

module.exports = Automaton
