import * as escodegen from 'escodegen';
import * as esprima from 'esprima';
import search from './search';
import removeEmptyStatements from './optimize/removeEmptyStatements';
import removeUselessStatements from './optimize/removeUselessStatements';

const testProgram = `
'use strict';
var x = 42;
true;;
lol;
lol();
require('asdf').asdf;
kkkkkkkkkkk
asdf
x = 123;
1234567
hahah;;;;;
function f() {
    asdf;;;;;;;
    lol();
    hi
}
(() => lol())();
;;;;;;;
bye
`

const ast = esprima.parse(testProgram);

search(ast, removeEmptyStatements);
search(ast, removeUselessStatements);

console.log(escodegen.generate(ast));

console.log(ast);