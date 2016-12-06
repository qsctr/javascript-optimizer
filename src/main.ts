import { generate } from 'escodegen';
import { parse } from 'esprima';
import { readFileSync, writeFileSync } from 'fs';
import optimizations from './optimizations';
import { FixedState, getFixedState, search } from './utils';

for (const filename of process.argv.slice(2)) {
    try {
        const file = readFileSync(filename, 'utf-8');
        try {
            const ast = parse(file, { loc: true });
            console.log(`========== ${filename} ==========`);
            for (const optimization in optimizations) {
                search(optimizations[optimization])(ast);
            }
            console.log();
            try {
                const newFile = generate(ast);
                try {
                    writeFileSync(filename, newFile);
                } catch (err) {
                    console.log(`Unable to write to file ${filename}: ${err}`);
                }
            } catch (err) {
                console.log(`Unable to generate file ${filename}: ${err}`);
            }
        } catch (err) {
            console.log(`Unable to parse file ${filename}: ${err}`);
        }
    } catch (err) {
        console.log(`Unable to read file ${filename}: ${err}`);
    }
}

switch (getFixedState()) {
    case FixedState.NoOptimizations:
        console.log(`No optimizations performed`);
        break;
    case FixedState.AllFixed:
        console.log(`All errors fixed`);
        break;
    case FixedState.SomeNotFixed:
        console.log(`Some errors not fixed`);
        break;
}