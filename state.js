/** Class representing a state of an automaton. */

class State {
  /**
     * create a state
     * @param {string} name - the name of the state
     * @param {boolean} [start] - true if a start state
     * @param {boolean} [final] - true if a final state
     * @param {Object} [tag] - an arbitrary object with additional information
     */
  constructor (name, start = false, final = false, tag = {}) {
    if (name === '') {
      name = 'empty'
    }
    this.name = name
    this.start = start
    this.final = final
    this.tag = tag
    this.edgesOut = new Set()
    this.edgesIn = new Set()
  }

  // State.prototype.addEdgeOut = (edge) => {
  //    this will be Automaton!!!
  // }

  /**
     * add an edge to the set of outgoing edges of the state
     * @param {Edge} edge - edge to be added
     */
  addEdgeOut (edge) {
    this.edgesOut.add(edge)
  }

  /**
     * make the state to a final state
     */
  makeFinal () {
    this.final = true
  }

  /**
     * add an edge to the set of incoming edges of the state
     * @param {Edge} edge - edge to be added
     */
  addEdgeIn (edge) {
    this.edgesIn.add(edge)
  }

  /**
     * convert the state to a string
     * @return {string} a string representing the state
     */
  toString () {
    return (
      this.name +
            (this.start ? ':start' : '') +
            (this.final ? ':final' : '') +
            (this.marked ? ':marked' : '')
    )
  }

  /**
     * comparison function which compares states by their name
     * @param {State} s1
     * @param {State} s2
     * @returns {number} -1, 0 or 1
     */
  static compareByName (s1, s2) {
    if (s1.name < s2.name) {
      return -1
    }
    if (s1.name > s2.name) {
      return 1
    }
    return 0
  }
}

module.exports = State
