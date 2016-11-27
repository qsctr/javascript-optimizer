import { Node, BlockStatement } from 'estree';
import { loopChildren } from './utils';

export type Optimization = (node: Node) => boolean;

export const optimizations: { [name: string]: Optimization } = {

    emptyStatements: removeFromBlockIf(
        stmt => stmt.type === 'EmptyStatement',
        'Empty statement, removed'
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
                return [remove(block, -1), 'Useless return, removed'];
            }
        }
        return true;
    },

    voidOperator: (node: Node) => {

        if (node.type === 'ExpressionStatement'
        && node.expression.type === 'UnaryExpression'
        && node.expression.operator === 'void'
        && isPureExpression(node.expression.argument)) {
            node.expression = {
                type: 'Identifier',
                name: 'undefined'
            };
            return 
        }
    },

    invalidReturn: (node: Node) => {
        if (isBlockFunction(node)) {
            return false;
        }
        const block = getBlock(node);
        if (block) {
            for (const stmt of block) {
                if (stmt.type === 'ReturnStatement') {
                    return [stmt, 'Invalid return statement'];
                }
            }
        }
        return true;
    }

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
                return newChild;
            }
        });
        return true;
    }
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
    return ['ThisExpression', 'Literal', 'Identifier'].includes(node.type);
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