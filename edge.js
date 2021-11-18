/** Class representing an edge (transition) of an automaton. */

class Edge {
  /**
     * create an edge.
     * @param {*} from - source state
     * @param {*} to - target state
     * @param {*} symbol - label
     * @returns {Edge} new edge
     */
  constructor (from, to, symbol) {
    this.source = from
    this.sink = to
    this.symbol = symbol
  }

  /**
     * name getter
     * @returns {string} name of the edge
     */
  get name () {
    let reString = ''
    if (this.re !== undefined) {
      reString = ' re: ' + this.re.toString()
    }
    return (
      this.source.name +
            '-' +
            this.symbol +
            '-' +
            this.sink.name +
            reString
    )
  }

  /**
     * convert edge to a string
     * @returns {string} a string representing the edge
     */
  toString () {
    return this.name
  }

  /**
     * compare edges by comparing their labels
     * @param {Edge} e1 - first edge
     * @param {Edge} e2 - second edge
     * @returns {number} -1 if symbol of first edge is smaller than symbol of second edge,
     * 0 if equal, 1 if larger
     */
  static compareBySymbol (e1, e2) {
    if (e1.symbol < e2.symbol) {
      return -1
    }
    if (e1.symbol > e2.symbol) {
      return 1
    }
    return 0
  }
}
/*
Object.defineProperty(Edge.prototype, "name", {
    get: function () { return this.source.name + "-" + this.symbol + "-" + this.sink.name }
})
*/

module.exports = Edge
