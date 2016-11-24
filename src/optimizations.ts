import { Node, BlockStatement } from 'estree';

export type Optimization = (node: Node) => [Node, string] | null;

export const optimizations: { [name: string]: Optimization } = {

    emptyStatements: (node: Node) => {
        const block = getBlock(node);
        if (block) {
            const index = block.findIndex(stmt => stmt.type === 'EmptyStatement');
            if (index >= 0) {
                return [remove(block, index), 'Empty statement, removed'];
            }
        }
        return null;
    },

    uselessStatements: (node: Node) => {
        const block = getBlock(node);
        if (block) {
            for (let i = 0; i < block.length; i++) {
                const stmt = block[i];
                if (stmt.type === 'ExpressionStatement') {
                    switch (stmt.expression.type) {
                        case 'ThisExpression':
                            return [remove(block, i), 'Useless this, removed'];
                        case 'Literal':
                            if (stmt.expression.value === 'use strict') {
                                continue;
                            }
                            return [remove(block, i), 'Useless literal, removed'];
                        case 'Identifier':
                            return [remove(block, i), 'Useless identifier, removed'];
                    }
                }
            }
        }
        return null;
    },

    uselessReturn: (node: Node) => {
        const block = getFunctionBlock(node);
        if (block) {
            const last = block[block.length - 1];
            if (last.type === 'ReturnStatement' && (!last.argument
            || (last.argument.type === 'Identifier' && last.argument.name === 'undefined')))
            // return [remove(block, -1), 'Useless return, removed'];
        }
        return null;
    },

    voidOperator: (node: Node) => {
        
    }

}

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

function getFunctionBlock(node: Node) {
    if (node.type === 'FunctionDeclaration'
    || node.type === 'FunctionExpression'
    || (node.type === 'ArrowFunctionExpression' && node.body.type === 'BlockStatement')) {
        return (node.body as BlockStatement).body;
    }
    return null;
}

function remove(arr: Node[], i: number) {
    return arr.splice(i, 1)[0];
}