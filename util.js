/**
 * A generator for all permutations of 0...number-1
 * @param {Number} number - an integer >= 0
 * @returns {Array} the next permutation. The permutation is given by an array
 * containing the integers from 0 up to number-1 in a permutated order.
 */
function * permutations (number) {
  if (number <= 0) {
    throw new Error('must be positive')
  }
  if (number === 1) {
    yield [0]
  } else {
    const perms = permutations(number - 1)
    let p
    while ((p = perms.next().value) !== undefined) {
      for (let i = 0; i < number; i++) {
        yield p.slice(0, i).concat(number - 1).concat(p.slice(i))
      }
    }
  }
}

exports.permutations = permutations

/**
 * Calculate a random permutation of 0...number-1
 * @param {Number} number - an integer >= 0
 * @returns {Array} a random permutation. The permutation is given by an array
 * containing the integers from 0 up to number-1 in a random order.
 */
function randomPermutation (number) {
  const perm = []
  for (let i = 0; i < number; i++) {
    perm[i] = i
  }
  for (let round = 0; round < number; round++) {
    const pos1 = Math.floor(Math.random() * number)
    const pos2 = Math.floor(Math.random() * number)
    const tmp = perm[pos1]
    perm[pos1] = perm[pos2]
    perm[pos2] = tmp
    // TODO Zuweisung an pos2 wird dann übersprungen !??
    // [perm[pos1], perm[pos2]] = [perm[pos2], perm[pos1]]
  }
  return perm
}

exports.randomPermutation = randomPermutation

/**
 * Calculate the product (composition) of two permutations. The permutations
 * must be array of the same length containing the integers from 0 up to
 * length-1.
 * @param {Array} p1 - first permutation
 * @param {Array} p2 - second permutation
 * @returns {Array} the product of the two permutations.
 */
function permutationProduct (p1, p2) {
  const p = []
  p1.forEach((v, i) => (p[i] = p2[p1[i]]))
  return p
}

exports.permutationProduct = permutationProduct

/**
 * Convert a non-negative integer to Base62 representation (invented here).
 * 0..9   -> 0..9
 * 10..35 -> A..Z
 * 36..61 -> a..z
 * @param {Number} number - an integer >= 0
 * @param {Number} totalDigits - the minimum number of digits the result should have
 * @returns {String} a string containing the Base62 representation of the number.
 * If necessary it is
 * left padded with zeroes to reach the number of totalDigits.
 */
function toBase62 (number, totalDigits = 1) {
  let result = ''
  let digit
  while (number > 0) {
    const remainder = number % 62
    if (remainder < 10) {
      digit = String.fromCodePoint('0'.codePointAt(0) + remainder)
    } else if (remainder < 36) {
      digit = String.fromCodePoint('A'.codePointAt(0) + remainder - 10)
    } else {
      digit = String.fromCodePoint('a'.codePointAt(0) + remainder - 36)
    }
    result = digit + result
    number = (number - remainder) / 62
  }
  while (result.length < totalDigits) {
    result = '0' + result
  }
  return result
}

exports.toBase62 = toBase62

/**
 * Convert a Base62 representation {@link toBase62} to an integer
 * @param {String} str
 * @returns {Number} the number represented by the Base62 string.
 */
function fromBase62 (str) {
  let result = 0
  for (let i = 0; i < str.length; i++) {
    result *= 62
    const digit = str[i]
    if (digit >= '0' && digit <= '9') {
      result += digit.codePointAt(0) - '0'.codePointAt(0)
    } else if (digit >= 'A' && digit <= 'Z') {
      result += digit.codePointAt(0) - 'A'.codePointAt(0) + 10
    } else {
      result += digit.codePointAt(0) - 'a'.codePointAt(0) + 36
    }
  }
  return result
}
exports.fromBase62 = fromBase62
