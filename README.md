## parse-html

简单的解析，当然还没有完成，只是写了很小的一部分，将涉及到的部分

* 词法解析
* 语法解析
* 构建DOM

当然后面解析完html生成DOM后，会解析一下CSS，组合成CSSOM，以及Javascript的解析，然后探究一下具体的回流重绘部分。
目前暂不清楚排版问题以及如何在浏览器内显示出相应的图形来。
了解到的部分是模型构建成位图，然后剩余部分交给操作系统来完成，暂时不清楚。

### 参考资料

[HTML官方文档状态机](https://html.spec.whatwg.org/multipage/parsing.html#tokenization)

[构建DOM](http://w3c.github.io/html/syntax.html#tree-construction)

[来自github](https://github.com/aimergenge/toy-html-parser)

[重学前端](https://time.geekbang.org/column/article/80260)
