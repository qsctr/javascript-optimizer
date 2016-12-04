import { Node, Identifier } from 'estree';
import {
    search,
    removeFromBlockIf,
    removeFromFunctionBlockIf,
    replaceChildIf,
    getBlock,
    getFunctionBlock,
    isPureExpression,
    remove,
    sliceRemove,
    print
} from './utils';

export type Optimization = (node: Node) => Action;

export const enum Action {
    Stop, Continue
}

const optimizations: { [name: string]: Optimization } = {

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
        return Action.Continue;
    },

    variableShadowing: (node: Node) => {
        const block = getBlock(node);
        if (block) {
            for (let i = 0; i < block.length; i++) {
                const stmt = block[i];
                if (stmt.type === 'VariableDeclaration') {
                    for (const stmt1 of sliceRemove(block, i)) {
                        if (search(child => {
                            if (child.type === 'VariableDeclaration' && child.declarations.some(inner =>
                                inner.id.type === 'Identifier' && stmt.declarations.some(outer =>
                                    outer.id.type === 'Identifier'
                                    && outer.id.name === (inner.id as Identifier).name))) {
                                return Action.Stop;
                            }
                            return Action.Continue;
                        })(stmt1) === Action.Stop) {
                            
                            return Action.Stop;
                        }
                    }
                }
            }
        }
    },

    deadFunction: removeFromFunctionBlockIf(
        (stmt, i, block) => stmt.type === 'FunctionDeclaration'
            && sliceRemove(block, i).some(stmt1 => search(child => {
                if (child.type === 'Identifier' && child.name === stmt.id.name) {
                    return Action.Stop;
                }
                return Action.Continue;
            })(stmt1) === Action.Stop),
        'Unreferenced function, removed'
    ),

    deadVar: removeFromFunctionBlockIf(
        (stmt, i, block) => stmt.type === 'VariableDeclaration' && stmt.kind === 'var'
            && bl,
        'Unreferenced function-scoped variable, removed'
    )

};

export default optimizations;