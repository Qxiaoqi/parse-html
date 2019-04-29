const { HTMLLexicalParse } = require("./lexers");

// const testHTML = `<html maaa=a >
// <head>
//   <title>cool</title>
// </head>
// <body>
//   <img src="a" />
// </body>
// </html>`

const testHTML = `<1html>`

let lexer = new HTMLLexicalParse();

// 遍历
for (let c of testHTML) {
  // console.log(c);
  lexer.receiveInput(c);
}