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

// 输出
const emitToken = Symbol("emitToken");
// 打印错误
const error = Symbol("error");




class HTMLLexicalParse {
  constructor() {
    // 记录目前状态
    this._state = this[data];
    // 记录分析出来的token
    this._token = null;
    // 记录分析出来的属性
    this._attribute = null;
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
        // return this[characterReference]; 

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
    // DOCTYPE
    if (c === "!") {
      // return this[markupDeclarationOpen];
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

    // 解析错误，当然未必错误，这里有些情况没有写
    return this[error](c);
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
      // return this[selfClosingStartTag];
    }

    if (c === ">") {
      this[emitToken](this._token);
      return this[data];
    }

    // 开始标签名称
    if (/[a-zA-z]/.test(c)) {
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

  }

  [emitToken](token) {
    if (typeof token === 'string') {
      console.log(`String(${token.replace(/ /, '<whitespace>').replace(/\n/, '\\n')})`)
    } else {
      console.log(token);
    }
  }

  [error](c) {
    console.log(`warn: ${c}`);
    // 这里如何进行错误处理？待考虑
    // 这个token会解析错误，跳过这个token解析后面的token？
  }
}

// 每解析出一个token，就声明相应对象
// 开始标签
class StartTagToken {}

// 闭合标签
class EndTagToken {}

// 属性
class Attribute {}

module.exports = {
  HTMLLexicalParse
}
