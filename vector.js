/** Class representing a vector. */

class Vector {
  /**
     * create a 2D vector.
     * @param {number} x - x coordinate
     * @param {number} y - y coordionate
     * @returns {Vector} new vector
     */
  constructor (x, y) {
    this.x = x
    this.y = y
  }

  static fromPoint (p) {
    if (p === undefined) {
      return undefined
    }
    return new Vector(p.x, p.y)
  }

  static from2Points (p1, p2) {
    return p2.subtract(p1)
  }

  static fromRadian (radian, radius = 1) {
    return new Vector(radius * Math.cos(radian), radius * Math.sin(radian))
  }

  /**
     * convert vector to a string
     * @returns {string} a string representing the vector
     */
  toString (maximumSignificantDigits = 4) {
    const msd = maximumSignificantDigits
    return `(${format(this.x, msd)}, ${format(this.y, msd)})`
  }

  toPathString (maximumSignificantDigits = 4) {
    const msd = maximumSignificantDigits
    return format(this.x, msd) + ' ' + format(this.y, msd)
  }

  length () {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  copy () {
    return new Vector(this.x, this.y)
  }

  /**
     *
     * calculate the angle between the current vector v1 and a given vector v2.
     * counterclockwise
     * @param {gives} v2
     */
  angleRadian (v2 = new Vector(1, 0)) {
    const v1 = this
    const cosPhi = (v1.x * v2.x + v1.y * v2.y) / (v1.length() * v2.length())
    let phi = Math.acos(cosPhi)
    if (v1.crossProduct(v2) < 0) {
      phi = 2 * Math.PI - phi
    }
    return phi
  }

  angleDegree (v2) {
    return this.angleRadian(v2) * 180 / Math.PI
  }

  add (v2) {
    const v1 = this
    return new Vector(v1.x + v2.x, v1.y + v2.y)
  }

  subtract (v2) {
    const v1 = this
    return new Vector(v1.x - v2.x, v1.y - v2.y)
  }

  crossProduct (v2) {
    const v1 = this
    return v1.x * v2.y - v2.x * v1.y
  }

  scale (factor) {
    return new Vector(factor * this.x, factor * this.y)
  }

  mirrorX () {
    return new Vector(this.x, -this.y)
  }

  mirrorY () {
    return new Vector(-this.x, this.y)
  }

  transform (scale, maxY) {
    return new Vector(scale * this.x, scale * (maxY - this.y))
  }

  unitVector () {
    return this.scale(1 / this.length())
  }

  withLength (length) {
    if (length < 0) {
      throw new Error('withLength: length must be nonnegative')
    }
    return this.unitVector().scale(length)
  }

  nearestGridPoint (gridSize) {
    return new Vector(
      Math.round(this.x / gridSize) * gridSize,
      Math.round(this.y / gridSize) * gridSize
    )
  }

  normalVector (length = 1) {
    return new Vector(this.y, -this.x).withLength(length)
  }
}

function format (number, msd) {
  return new Intl.NumberFormat('en', {
    maximumSignificantDigits: msd,
    useGrouping: false
  }).format(number)
}

module.exports = Vector
