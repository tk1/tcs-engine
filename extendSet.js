/** @module extendSet */

/**
 * extend the builtin set with new methods.
 */
Set.prototype.contains = function (set) {
  for (const element of set) {
    if (!this.has(element)) {
      return false
    }
  }
  return true
}

Set.prototype.name = function (sep = ',') {
  return [...this]
    .map(
      s =>
        s.name === undefined
          ? s.toString()
          : typeof s.name === 'function' ? s.name('-') : s.name
    )
    .sort()
    .join(sep)
}

Set.prototype.equals = function (set) {
  return this.contains(set) && set.contains(this)
}

Set.prototype.union = function (set) {
  return new Set([...this, ...set])
}

Set.prototype.intersect = function (set) {
  if (set.size > this.size) {
    var a = this
    var b = set
  } else {
    a = set
    b = this
  }
  return new Set([...a].filter(x => b.has(x)))
}

Set.prototype.difference = function (set) {
  return new Set([...this].filter(x => !set.has(x)))
}
