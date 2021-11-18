# if changed run: npm run grammar

# do not use: exp. runtime in MD

@{%
const Rex = require('./regexp')
%}

S -> AS {% id %}

# We define each level of precedence as a nonterminal.

# Parentheses
P -> "(" AS ")" {% d => d[1] %}
	
# Exponents
E -> P "*" {% d => ( {type: 'STAR', d: d[0], v: d[0].v.star() }) %}  

F -> P  {% id %}
    | W  {% id %}
    | E  {% id %}    

# Concatenation
MD -> MD F {% d=> { 
    let re = d[0].v.concat(d[1].v)
    return { type: 'CONCAT', d: d, v: re }
 } %}
 | F {% id %}
		
# Addition 
AS -> AS "+" MD {% d => ({ type: 'SUM', d: [d[0], d[2]], v: d[0].v.sum(d[2].v) }) %}
    | MD  {% id %}    			

# Word with starred symbols
W -> (SYMBOL|SSYMBOL):+ {% d => {
    let re = d[0][0][0].v
    for (let i=1; i<d[0].length; i++) {
        re = re.concat(d[0][i][0].v)
    }
    return { type: 'WS', d: d[0], v: re }
 } %}
	| "E"      {% d => ({type: 'EPS', v: new Rex('')}) %}   

SYMBOL -> [a-z] {% d => ({ type: 'C', d: d[0], v: new Rex(d[0]) }) %}

SSYMBOL -> SYMBOL "*" {% d => ( {type: 'STAR', d: d[0], v: new Rex(d[0].d).star() }) %}