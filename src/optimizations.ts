import {
    ExpressionStatement,
    FunctionDeclaration,
    Identifier,
    Node,
    UnaryExpression,
    VariableDeclaration,
    VariableDeclarator
} from 'estree';
import {
    search,
    removeFromBlockIf,
    removeFromFunctionBlockIf,
    removeFromDeclarationsIf,
    replaceChildIf,
    noReferencesTo,
    getBlock,
    getFunctionBlock,
    isPureExpression,
    showPureExpression,
    isFunction,
    remove,
    sliceRemove,
    print,
    formatLoc
} from './utils';

export type Optimization = (node: Node) => Action;

export const enum Action {
    Stop, Continue
}

const optimizations: { [name: string]: Optimization } = {

    emptyStatements: removeFromBlockIf(
        stmt => stmt.type === 'EmptyStatement',
        'Empty statement, removed',
        true
    ),

    debugger: removeFromBlockIf(
        stmt => stmt.type === 'DebuggerStatement',
        '"debugger" statement, removed',
        true
    ),

    voidOperator: replaceChildIf(
        node => node.type === 'UnaryExpression'
            && node.operator === 'void'
            && isPureExpression(node.argument),
        {
            type: 'Identifier',
            name: 'undefined'
        },
        (node: UnaryExpression) =>
            `Replaced "void ${showPureExpression(node.argument)}" with undefined`,
        true
    ),

    uselessStatements: removeFromBlockIf(
        stmt => stmt.type === 'ExpressionStatement'
            && isPureExpression(stmt.expression)
            && !(stmt.expression.type === 'Literal'
                && stmt.expression.value === 'use strict'),
        (stmt: ExpressionStatement) =>
            `Useless statement "${showPureExpression(stmt.expression)};", removed`,
        true
    ),

    uselessReturn: (node: Node) => {
        const block = getFunctionBlock(node);
        if (block) {
            const last = block[block.length - 1];
            if (last.type === 'ReturnStatement' && (!last.argument
            || (last.argument.type === 'Identifier' && last.argument.name === 'undefined'))) {
                print(remove(block, -1), 'Useless return, removed', true);
            }
        }
        return Action.Continue;
    },

    deadFunction: removeFromFunctionBlockIf(
        (stmt, i, block) => stmt.type === 'FunctionDeclaration'
            && noReferencesTo(stmt.id, sliceRemove(block, i)),
        (func: FunctionDeclaration) => `Unreferenced function ${func.id.name}, removed`,
        true
    ),

    deadVar: removeFromFunctionBlockIf(
        (stmt, i, block) => {
            if (stmt.type === 'VariableDeclaration' && stmt.kind === 'var') {
                removeFromDeclarationsIf(
                    (declarator: VariableDeclarator, j: number, declarations: VariableDeclarator[]) =>
                        declarator.id.type === 'Identifier'
                        && noReferencesTo(declarator.id,
                            sliceRemove(block, i).concat(sliceRemove(declarations, j))),
                    (declarator: VariableDeclarator) =>
                        `Unreferenced variable ${(declarator.id as Identifier).name}, removed`,
                    true
                )(stmt);
                return stmt.declarations.length === 0;
            }
            return false;
        }
    ),

    variableShadowing: (node: Node) => {
        const block = getBlock(node);
        if (block) {
            for (let i = 0; i < block.length; i++) {
                const stmt = block[i];
                if (stmt.type === 'VariableDeclaration') {
                    for (const stmt1 of sliceRemove(block, i)) {
                        search(child => {
                            if (child.type === 'VariableDeclaration') {
                                for (const inner of child.declarations) {
                                    if (inner.id.type === 'Identifier') {
                                        checkOuter(inner.id);
                                    }
                                }
                            } else if (isFunction(child)) {
                                for (const inner of child.params) {
                                    if (inner.type === 'Identifier') {
                                        checkOuter(inner);
                                    }
                                }
                                if (child.type === 'FunctionDeclaration'
                                || (child.type === 'FunctionExpression' && child.id)) {
                                    checkOuter((child as { id: Identifier }).id);
                                }
                            }
                            function checkOuter(inner: Identifier) {
                                for (const outer of
                                (stmt as VariableDeclaration).declarations) {
                                    if (outer.id.type === 'Identifier'
                                    && outer.id.name === inner.name) {
                                        print(inner, `Declaration of ${inner.name} is shadowing declaration at ${formatLoc(outer)}`, false);
                                    }
                                }
                            }
                            return Action.Continue;
                        })(stmt1);
                    }
                }
            }
        }
        return Action.Continue;
    }

};

export default optimizations;