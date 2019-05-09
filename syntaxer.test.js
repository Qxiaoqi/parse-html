const { HTMLSyntaticalParser } = require("./syntaxer");
const { HTMLLexicalParse } = require("./lexers");

const testHTML = `
<html maaa=a >
    <head>
        <title>cool</title>
    </head>
    <body>
        <img src="a" />
    </body>
</html>`

const syntaxer = new HTMLSyntaticalParser();
const lexer = new HTMLLexicalParse(syntaxer);

for (let c of testHTML) {
  lexer.receiveInput(c);
}

console.log(JSON.stringify(syntaxer.getOutput(), null, 2));
