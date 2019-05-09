const { HTMLLexicalParse } = require("./lexers");

const testHTML = `<html maaa=a >
<head>
  <title>cool</title>
</head>
<body>
  <img src="a" />
</body>
</html>`

// const testHTML = `<img src="a" />`

const tempSyntaxer = {
  receiveInput: (token) => {
    if (typeof token === 'string') {
      console.log(`String(${token.replace(/ /, '<whitespace>').replace(/\n/, '\\n')})`)
    } else {
      console.log(token);
    }
  }
}

let lexer = new HTMLLexicalParse(tempSyntaxer);



// 遍历
for (let c of testHTML) {
  // console.log(c);
  lexer.receiveInput(c);
}
