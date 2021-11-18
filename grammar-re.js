// Generated automatically by nearley
// http://github.com/Hardmath123/nearley
(function () {
function id(x) {return x[0]; }

const Rex = require('./regexp')
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "S", "symbols": ["AS"], "postprocess": id},
    {"name": "P", "symbols": [{"literal":"("}, "AS", {"literal":")"}], "postprocess": d => d[1]},
    {"name": "E", "symbols": ["P", {"literal":"*"}], "postprocess": d => ( {type: 'STAR', d: d[0], v: d[0].v.star() })},
    {"name": "F", "symbols": ["P"], "postprocess": id},
    {"name": "F", "symbols": ["W"], "postprocess": id},
    {"name": "F", "symbols": ["E"], "postprocess": id},
    {"name": "MD", "symbols": ["MD", "F"], "postprocess": d=> { 
           let re = d[0].v.concat(d[1].v)
           return { type: 'CONCAT', d: d, v: re }
        } },
    {"name": "MD", "symbols": ["F"], "postprocess": id},
    {"name": "AS", "symbols": ["AS", {"literal":"+"}, "MD"], "postprocess": d => ({ type: 'SUM', d: [d[0], d[2]], v: d[0].v.sum(d[2].v) })},
    {"name": "AS", "symbols": ["MD"], "postprocess": id},
    {"name": "W$ebnf$1$subexpression$1", "symbols": ["SYMBOL"]},
    {"name": "W$ebnf$1$subexpression$1", "symbols": ["SSYMBOL"]},
    {"name": "W$ebnf$1", "symbols": ["W$ebnf$1$subexpression$1"]},
    {"name": "W$ebnf$1$subexpression$2", "symbols": ["SYMBOL"]},
    {"name": "W$ebnf$1$subexpression$2", "symbols": ["SSYMBOL"]},
    {"name": "W$ebnf$1", "symbols": ["W$ebnf$1", "W$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "W", "symbols": ["W$ebnf$1"], "postprocess": d => {
           let re = d[0][0][0].v
           for (let i=1; i<d[0].length; i++) {
               re = re.concat(d[0][i][0].v)
           }
           return { type: 'WS', d: d[0], v: re }
        } },
    {"name": "W", "symbols": [{"literal":"E"}], "postprocess": d => ({type: 'EPS', v: new Rex('')})},
    {"name": "SYMBOL", "symbols": [/[a-z]/], "postprocess": d => ({ type: 'C', d: d[0], v: new Rex(d[0]) })},
    {"name": "SSYMBOL", "symbols": ["SYMBOL", {"literal":"*"}], "postprocess": d => ( {type: 'STAR', d: d[0], v: new Rex(d[0].d).star() })}
]
  , ParserStart: "S"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
