import * as escodegen from 'escodegen';
import * as esprima from 'esprima';
import optimizations from './optimizations';
import { search } from './utils';

const testProgram = `
    'use strict';
    var x = 0;;
    x = 42;
    void 0;
    x = void x;
    function f() {
        asdf;;
        return 1;
        asdf;
        return;
        123;
        'hello';
    };;;
    f();
    (function () {
        function abc() {
            console.log('hi');
            abc();
        }
        'hello world!';
        return;
    })();
    const x = 5;
    x = 10;
    let y = 5;
    let y = 10;
`

const ast = esprima.parse(testProgram, {
    loc: true
});

for (const optimization in optimizations) {
    search(optimizations[optimization])(ast);
}

console.log(escodegen.generate(ast));

console.log(JSON.stringify(ast));