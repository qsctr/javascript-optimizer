import * as escodegen from 'escodegen';
import * as esprima from 'esprima';
import search from './search';

const testProgram = ``

const ast = esprima.parse(testProgram, {
    loc: true
});

console.log(escodegen.generate(ast));

console.log(ast);