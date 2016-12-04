import { Node, BlockStatement, FunctionDeclaration } from 'estree';
import Optimization from './optimization';
import { loopChildren } from './search';

export const optimizations: { [name: string]: Optimization } = {

    emptyStatements: removeFromBlockIf(
        stmt => stmt.type === 'EmptyStatement',
        'Empty statement, removed'
    ),

    production: removeFromBlockIf(
        stmt => stmt.type === 'DebuggerStatement',
        'Debugger statement, removed'
    ),

    voidOperator: replaceChildIf(
        node => node.type === 'UnaryExpression'
            && node.operator === 'void'
            && isPureExpression(node.argument),
        {
            type: 'Identifier',
            name: 'undefined'
        },
        'Replaced void expression with undefined'
    ),

    uselessStatements: removeFromBlockIf(
        stmt => stmt.type === 'ExpressionStatement' && isPureExpression(stmt.expression),
        'Useless statement, removed'
    ),

    uselessReturn: (node: Node) => {
        const block = getFunctionBlock(node);
        if (block) {
            const last = block[block.length - 1];
            if (last.type === 'ReturnStatement' && (!last.argument
            || (last.argument.type === 'Identifier' && last.argument.name === 'undefined'))) {
                print(remove(block, -1), 'Useless return, removed');
            }
        }
        return true;
    },

    deadFunction: (node: Node) => {
        const block = getFunctionBlock(node);
        if (block) {
            for (const stmt of block) {
                if (stmt.type === 'FunctionDeclaration'
                && !block.some(function called(child: Node) {
                    if ((child.type === 'CallExpression' || child.type === 'NewExpression')
                    && child.callee.type === 'Identifier'
                    && child.callee.name === stmt.id.name) {
                        return true;
                    }
                })) {
                    
                }
            }
        }
    }

    // esprima already checks for invalid return
    // invalidReturn: (node: Node) => {
    //     if (isBlockFunction(node)) {
    //         return false;
    //     }
    //     const block = getBlock(node);
    //     if (block) {
    //         for (const stmt of block) {
    //             if (stmt.type === 'ReturnStatement') {
    //                 print(stmt, 'Invalid return statement');
    //             }
    //         }
    //     }
    //     return true;
    // }

};

function getBlock(node: Node) {
    switch (node.type) {
        case 'Program':
        case 'BlockStatement':
            return node.body;
        case 'SwitchCase': // meta switch case
            return node.consequent;
    }
    return null;
}

function removeFromBlockIf(pred: (node: Node) => boolean, message: string): Optimization {
    return node => {
        const block = getBlock(node);
        if (block) {
            for (let i = 0; i < block.length;) {
                if (pred(block[i])) {
                    print(remove(block, i), message);
                } else {
                    i++;
                }
            }
        }
        return true;
    };
}

function replaceChildIf(pred: (node: Node) => boolean, newChild: Node, message: string): Optimization {
    return node => {
        loopChildren(node, child => {
            if (pred(child)) {
                print(child, message);
                return newChild;
            }
        });
        return true;
    };
}

function isBlockFunction(node: Node) {
    return node.type === 'FunctionDeclaration'
        || node.type === 'FunctionExpression'
        || (node.type === 'ArrowFunctionExpression' && node.body.type === 'BlockStatement');
}

function getFunctionBlock(node: Node) {
    if (isBlockFunction(node)) {
        return (node as { body: BlockStatement }).body.body;
    }
    return null;
}

function isPureExpression(node: Node) {
    return node.type === 'ThisExpression'
        || node.type === 'Literal'
        || node.type === 'Identifier';
}

function remove(arr: Node[], i: number) {
    return arr.splice(i, 1)[0];
}

function print({ loc }: Node, message: string) {
    if (loc) {
        console.log(`line ${loc.start.line} col ${loc.start.column} to line ${loc.end.line} col ${loc.end.column}: ${message}`);
    } else {
        console.log(`<no location info>: ${message}`);
    }
}