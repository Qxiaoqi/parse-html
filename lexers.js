/*
  token: {
    name: "",
    attribute: {
      name: ""
    }
  } 
  这里用Symbol模拟私有属性并不合适，因为token这个值是对象，
  而Symbol是类似于String的一个类型，并不能添加属性
  因此暂时用_来区分

  但是可以用来模拟私有方法

  []是ES6的属性名表达式

  状态大概有80个，这里只实现了部分常用的情况
*/

const data = Symbol("data");
const characterReference = Symbol("characterReference");
const tagOpen = Symbol("tagOpen");
const tagName = Symbol("tagName");
const endTagOpen = Symbol("endTagOpen");
const beforeAttributeName = Symbol("beforeAttributeName");
const attributeName = Symbol("attributeName");
const beforeAttributeValue = Symbol("beforeAttributeValue");
const attributeValueDoubleQuoted = Symbol("attributeValueDoubleQuoted");
const attributeValueSingleQuoted = Symbol("attributeValueSingleQuoted");
const attributeValueUnquoted = Symbol("attributeValueUnquoted");
const afterAttributeValueQuoted = Symbol("afterAttributeValueQuoted");
const selfClosingStartTag = Symbol("selfClosingStartTag");

// 注释部分
const markupDeclarationOpen = Symbol("markupDeclarationOpen");
const commentStart = Symbol("commentStart");
const commentStartDash = Symbol("commentStartDash");
const comment = Symbol("comment");
const commentEndDash = Symbol("commentEndDash");
const commentEnd = Symbol("commentEnd");


// 输出
const emitToken = Symbol("emitToken");
// 打印错误
const error = Symbol("error");




class HTMLLexicalParse {
  constructor(syntaxer) {
    // 记录目前状态
    this._state = this[data];
    // 记录分析出来的token
    this._token = null;
    // 记录分析出来的属性
    this._attribute = null;
    // 记录&的字符串
    this._character = null;
    // 记录注释文本
    this._comment = null;
    // 语法分析方法
    this._syntaxer = syntaxer;
  }

  // 读取传入的字符
  receiveInput(char) {
    // console.log(this._state);
    if (this._state === null) {
      throw new Error("parse error");
    } else {
      this._state = this._state(char);
    }
  }

  [data](c) {
    switch (c) {
      // &lt;
      case "&":
        this._character = "";
        return this[characterReference]; 

      case "<":
        return this[tagOpen];

      // 什么情况才触发这种情况？
      // case EOF:
        // console.log("EOF");

      // 空格 换行 等
      default:
        this[emitToken](c);
        return this[data];
    }
  }

  [tagOpen](c) {
    // DOCTYPE 或者 注释
    if (c === "!") {
      return this[markupDeclarationOpen];
    }

    // 结束标签
    if (c === "/") {
      this._token = new EndTagToken();
      this._token.name = "";
      return this[endTagOpen];
    }

    // 开始标签
    if (/[a-zA-z]/.test(c)) {
      this._token = new StartTagToken();
      this._token.name = c;
      return this[tagName];
    }

    // invalid-first-character-of-tag-name
    // Whereas, if an end tag was expected, such code point and all content that follows up to a U+003E (>) code point (if present) or to the end of the input stream is treated as a comment.
    // 解析错误，当然未必错误，这里有些情况没有写，比如!DOCTYPE
    // 错误情况比如 <42></42> 会解析成 #text: <42>  #comment: 42 ，即前者解析成文本，后者如果匹配到了结束标签，则后者解析成注释
    // 这里先不要急着写报错处理，在构建DOM时再写，在这里写没什么思路
    // 构建DOM时，将文本和注释插入目标即可
    // 记录并跳过该字符
    this[error](c);
    return this[tagOpen];
  }

  [endTagOpen](c) {
    if (c === ">") {
      this[emitToken](this._token);
      return this[data];
    }

    this._token.name += c;
    return this[endTagOpen];
  }

  [tagName](c) {
    // tab \t
    // LF 换行 \n
    // FF 换页 \f
    // SPACE 
    if (/[\t\n\f ]/.test(c)) {
      return this[beforeAttributeName];
    }

    if (c === "/") {
      // 这种情况下属于自闭和标签，比如<img/>
      this[emitToken](this._token);
      var endToken =  new EndTagToken();
      endToken.name = this._token.name;
      this._token = endToken;
      return this[selfClosingStartTag];
    }

    if (c === ">") {
      this[emitToken](this._token);
      return this[data];
    }

    // 开始标签名称
    if (/[a-zA-z0-9]/.test(c)) {
      this._token.name += c;
      return this[tagName];
    }

    // 如何抛错？比如输入了一个数字？
    // 目前是如果没有匹配到，也就没有返回状态，
    // 因此读下一个字符的时候会触发this._state === null内的代码

    // 但是这样对错误的处理并不合适，有待研究
  }

  [beforeAttributeName](c) {
    // tab \t
    // LF 换行 \n
    // FF 换页 \f
    // SPACE 
    if (/[\t\n\f ]/.test(c)) {
      return this[beforeAttributeName];
    }

    if (c === "/") {
      // 这种情况下属于自闭和标签，比如<img />
      this[emitToken](this._token);
      var endToken =  new EndTagToken();
      endToken.name = this._token.name;
      this._token = endToken;
      return this[selfClosingStartTag];
    }

    if (c === ">") {
      this[emitToken](this._token);
      return this[data];
    }

    if (c === "=") {
      // This is an unexpected-equals-sign-before-attribute-name parse error. Start a new attribute in the current tag token. Set that attribute's name to the current input character, and its value to the empty string. Switch to the attribute name state.
    }

    this._attribute = new Attribute();
    this._attribute.name = c;
    this._attribute.value = "";
    return this[attributeName];
  }

  [attributeName](c) {
    if (/[\t\n\f \/>]/.test(c)) {
      // return this[afterAttributeName];
    }

    if (c === "=") {
      return this[beforeAttributeValue];
    }

    if (/["'<]/.test(c)) {
      // This is an unexpected-character-in-attribute-name parse error. Treat it as per the "anything else" entry below.
    }

    this._attribute.name += c;
    return this[attributeName];
  }

  [beforeAttributeValue](c) {
    // 忽略
    if (/[\t\n\f ]/.test(c)) {
      return this[beforeAttributeValue];
    }

    if (/["]/.test(c)) {
      return this[attributeValueDoubleQuoted];
    }

    if (/[']/.test(c)) {
      return this[attributeValueSingleQuoted];
    }

    if (c === ">") {
      // This is a missing-attribute-value parse error. Switch to the data state. Emit the current tag token.
    }

    // 无双引号或单引号
    this._attribute.value += c;
    this._token[this._attribute.name] = this._attribute.value;
    return this[attributeValueUnquoted];
  }

  [attributeValueDoubleQuoted](c) {
    if (/["]/.test(c)) {
      this._token[this._attribute.name] = this._attribute.value;
      return this[afterAttributeValueQuoted];
    }

    if (c === "&") {

    }

    this._attribute.value += c;
    return this[attributeValueDoubleQuoted]; 
  }

  [attributeValueSingleQuoted](c) {
    if (/[']/.test(c)) {
      this._token[this._attribute.name] = this._attribute.value;
      return this[afterAttributeValueQuoted];
    }

    if (c === "&") {

    }

    this._attribute.value += c;
    return this[attributeValueSingleQuoted]; 
  }

  [attributeValueUnquoted](c) {
    if (/[\t\n\f ]/.test(c)) {
      return this[beforeAttributeName];
    }

    if (c === "&") {
      // 
    }

    if (c === ">") {
      this[emitToken](this._token);
      return this[data];
    }

    this._attribute.value += c;
    return this[attributeValueUnquoted];
  }

  [afterAttributeValueQuoted](c) {
    if (/[\t\n\f ]/.test(c)) {
      return this[beforeAttributeName];
    }

    if (c === "/") {
      // 这种情况下属于自闭和标签，比如<img src="a"/>
      this[emitToken](this._token);
      var endToken =  new EndTagToken();
      endToken.name = this._token.name;
      this._token = endToken;
      return this[selfClosingStartTag];
    }

    if (c === ">") {
      this[emitToken](this._token);
      return this[data];
    }
  }

  [selfClosingStartTag](c) {
    if (c === ">") {
      this[emitToken](this._token);
      return this[data];
    }
  }

  [characterReference](c) {
    if (c === ";") {
      this._character += c;
      this[emitToken](this._character);
      return this[data];
    }

    this._character += c;
    return this[characterReference];
  }

  // 下面几个是注释部分状态
  [markupDeclarationOpen](c) {
    if (c === "-") {
      return this[commentStart];
    }
  }

  [commentStart](c) {
    if (c === "-") {
      return this[commentStartDash];
    }
  }

  [commentStartDash](c) {
    if (c === "-") {
      return this[commentEnd];
    }

    // 进入注释文本
    this._comment = new CommentToken();
    this._comment.value = c;
    return this[comment];
  }

  [comment](c) {
    if (c === "-") {
      return this[commentEndDash];
    }

    this._comment.value += c;
    return this[comment];
  }

  [commentEndDash](c) {
    if (c === "-") {
      return this[commentEnd];
    }
  }

  [commentEnd](c) {
    if (c === ">") {
      this[emitToken](this._comment);
      return this[data];
    }
  }

  // 这里可重写不同的解析方法，将解析好的token传入语法分析的过程
  [emitToken](token) {
    this._syntaxer.receiveInput(token); 
  }

  [error](c) {
    console.log(`error: 字符 ${c} 出错`);
    // 这里如何进行错误处理？待考虑
    // 这个token会解析错误，跳过这个token解析后面的token？
  }
}

// 每解析出一个token，就声明相应对象
// 开始标签
class StartTagToken {}

// 闭合标签
class EndTagToken {}

// 注释
class CommentToken {}

// 属性
class Attribute {}

module.exports = {
  HTMLLexicalParse,
  StartTagToken,
  EndTagToken,
  CommentToken
}
