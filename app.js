const tcs = require('./main')

const a1 = tcs.Sample.modLength(0, 4)
console.log(a1.toString())

const re2s = 'b(ab)*b'
const re2 = tcs.RegularExpression.parse(re2s)
console.log(re2.left.accepts('b'))
console.log(re2.right.accepts('b'))
console.log(re2.accepts('bb'))
