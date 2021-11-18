/** Class representing an alphabet. */

class Alphabet {
  /**
     * create an alphabet consisting of the given symbols
     * @param {string} symbols - the symbols of the alphabet
     * @returns {Alphabet} a new alphabet
     */
  constructor (symbols) {
    this.symbols = [...symbols]
  }

  /**
     * a generator that returns the words of the given alphabet up to the given
     * maximal length.
     * @param {number} maxLength - the maximal length of generated words
     * @returns {string} the next word
     */
  * genWords (maxLength) {
    if (maxLength <= 0) {
      yield ''
    } else {
      const shorter = this.genWords(maxLength - 1)
      let v = shorter.next().value
      while (v !== undefined) {
        for (const s of this.symbols) {
          yield v + s
        }
        v = shorter.next().value
      }
    }
  }

  /**
     * a generator that returns all words of the given alphabet.
     * @returns {string} the next word
     */
  * genAllWords () {
    let length = 0
    while (true) {
      const words = this.genWords(length++)
      let w = words.next().value
      while (w !== undefined) {
        yield w
        w = words.next().value
      }
    }
  }

  /**
     * count the number of the symbol in the word
     * @param {string} word - word to be searched
     * @param {string} symbol - symobol to be searched for
     * @returns {number} the symbol count
     */
  numberOf (word, symbol) {
    return [...word].reduce((count, s) => count + (s === symbol ? 1 : 0), 0)
  }

  /**
     * generate a random word with a length between the given bounds
     * @param {number} minLength - minimum length
     * @param {number} maxLength - maximum length
     * @returns {string} the generated word
     */
  randomWord (minLength, maxLength) {
    const length =
            Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength
    let word = ''
    for (let i = 0; i < length; i++) {
      word += this.symbols[
        Math.floor(Math.random() * this.symbols.length)
      ]
    }
    return word
  }
}

module.exports = Alphabet
