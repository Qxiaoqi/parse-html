const { StartTagToken, EndTagToken } = require("./lexers");

const getTopStack = Symbol("getTopStack");
const error = Symbol("error");

// 根节点
class HTMLDocument {
  constructor() {
    this.isDocument = true;
    this.childNodes = [];
  }
}

class Node {}

// 一般节点
class Element extends Node {
  constructor(token) {
    super(token);
    // 将传入的token复制
    for (let k in token) {
      this[k] = token[k];
    }
    this.childNodes = [];
  }
}

// 文本节点
// 处理：相邻的Text节点合并，如果是文本节点，就合并。否则成为当前节点的子节点
class Text extends Node {
  constructor(value) {
    super(value);
    this.value = value;
  }
}

class HTMLSyntaticalParser {
  constructor() {
    this._stack = [new HTMLDocument];
  }

  // 读入词法解析产生的token所作的处理，即语法解析部分
  receiveInput(token) {
    // console.log(token);
    // 遇到文本节点，文本节点都是一个一个字符
    if (typeof token === "string") {
      if (this[getTopStack]() instanceof Text) {
        // 如果当前节点是文本节点，就合并
        // push的是对象，因此只是改动当前栈顶节点即可，其父节点的内容同样会改变
        this[getTopStack]().value += token;
      } else {
        // 不是文本节点，是文本，则入栈并成为当前节点子节点
        let textNode = new Text(token);
        // 成为子节点
        this[getTopStack]().childNodes.push(textNode);
        // 入栈
        this._stack.push(textNode);
      }
    } else if (this[getTopStack]() instanceof Text) {
      // 遇到不是文本节点，但当前栈顶节点是文本的情况下，须将文本节点弹出
      this._stack.pop();
    }

    if (token instanceof StartTagToken) {
      // console.log(token);
      // 插入当前节点的childNodes，并入栈
      let eleNode = new Element(token);
      this[getTopStack]().childNodes.push(eleNode);
      this._stack.push(eleNode);
    }
    
    if (token instanceof EndTagToken) {
      // console.log(this[getTopStack]());
      // console.log(token);
      // 出栈一个节点，检测是否匹配（错误处理还没做）
      if (this[getTopStack]().name === token.name) {
        // 匹配成功
        this._stack.pop();
      } else {
        // 不匹配
        this[error](token.name, this[getTopStack]().name);
      }
    }
  }

  // 输出结果部分
  getOutput() {
    return this._stack[0];
  }

  // 获得当前栈 最上面的 节点
  [getTopStack]() {
    return this._stack[this._stack.length - 1];
  }

  // 报错
  [error](startTagToken, endTagToken) {
    console.log(`error: <${startTagToken}> 和 <${endTagToken}> 标签不匹配`);
  }
}

module.exports = {
  HTMLSyntaticalParser
}