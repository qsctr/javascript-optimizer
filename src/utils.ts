import { Syntax } from 'esprima';
import {
    BlockStatement,
    Function as FunctionNode,
    Identifier,
    Literal,
    Node,
    ThisExpression
} from 'estree';
import { Optimization, Action } from './optimizations';

export function search(optimize: Optimization) {
    return (node: Node): Action => {
        if (optimize(node) === Action.Continue) {
            return loopChildren(node, search(optimize));
        }
        return Action.Stop;
    };
}

function loopChildren(node: Node, func: (node: Node) => Node | Action | void) {
    for (const prop in node) {
        if (node.hasOwnProperty(prop)) {
            if (isNode(node[prop])) {
                const res = func(node[prop]);
                if (typeof res === 'number') {
                    if (res === Action.Stop) {
                        return Action.Stop;
                    }
                } else if (res) {
                    node[prop] = res;
                }
            } else if (Array.isArray(node[prop])
            && node[prop].length && isNode(node[prop][0])) {
                for (let i = 0; i < node[prop].length; i++) {
                    const res = func(node[prop][i]);
                    if (typeof res === 'number') {
                        if (res === Action.Stop) {
                            return Action.Stop;
                        }
                    } else if (res) {
                        node[prop][i] = res;
                    }
                }
            }
        }
    }
    return Action.Continue;
}

function isNode(object: Object): object is Node {
    return object
        && object.hasOwnProperty('type')
        && Object.values(Syntax).includes((object as any).type);
}

type Predicate = (node: Node, i: number, block: Node[]) => boolean;
type Message = string | ((node: Node) => string);

export const removeFromBlockIf = removeFromBlockIfGeneric(getBlock);

export const removeFromFunctionBlockIf = removeFromBlockIfGeneric(getFunctionBlock);

// technically not a block, but it still works
export const removeFromDeclarationsIf = removeFromBlockIfGeneric(getDeclarations);

function removeFromBlockIfGeneric(blockFunc: (node: Node) => Node[] | null) {
    return (pred: Predicate, message?: Message, autoFixed = true): Optimization =>
        node => {
            const block = blockFunc(node);
            if (block) {
                for (let i = 0; i < block.length;) {
                    if (pred(block[i], i, block)) {
                        let removed = remove(block, i);
                        if (typeof message === 'function') {
                            print(removed, message(removed), autoFixed);
                        } else if (typeof message === 'string') {
                            print(removed, message, autoFixed);
                        }
                    } else {
                        i++;
                    }
                }
            }
            return Action.Continue;
        };
}

export function replaceChildIf(pred: (node: Node) => boolean,
newChild: Node, message: Message, autoFixed: boolean): Optimization {
    return node => {
        loopChildren(node, child => {
            if (pred(child)) {
                if (typeof message === 'function') {
                    print(child, message(child), autoFixed);
                } else {
                    print(child, message, autoFixed);
                }
                return newChild;
            }
        });
        return Action.Continue;
    };
}

export function noReferencesTo(id: Identifier, nodes: Node[]) {
    return nodes.every(node => search(child => {
        if (child.type === 'Identifier' && child.name === id.name) {
            return Action.Stop;
        }
        return Action.Continue;
    })(node) === Action.Continue);
}

export function getBlock(node: Node) {
    switch (node.type) {
        case 'Program':
        case 'BlockStatement':
            return node.body;
        case 'SwitchCase': // meta switch case
            return node.consequent;
    }
    return null;
}

export function getFunctionBlock(node: Node) {
    if (isBlockFunction(node)) {
        return (node as { body: BlockStatement }).body.body;
    }
    return null;
}

function getDeclarations(node: Node) {
    if (node.type === 'VariableDeclaration') {
        return node.declarations;
    }
    return null;
}

function isBlockFunction(node: Node) {
    return node.type === 'FunctionDeclaration'
        || node.type === 'FunctionExpression'
        || (node.type === 'ArrowFunctionExpression' && node.body.type === 'BlockStatement');
}

export function isPureExpression(node: Node): node is ThisExpression | Literal | Identifier {
    return ['ThisExpression', 'Literal', 'Identifier'].includes(node.type);
}

export function showPureExpression(node: Node) {
    switch (node.type) {
        case 'ThisExpression':
            return 'this';
        case 'Literal':
            return node.value + '';
        case 'Identifier':
            return node.name;
    }
    console.log(node.type);
}

export function isFunction(node: Node): node is FunctionNode {
    return ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']
        .includes(node.type);
}

export function remove(arr: Node[], i: number) {
    return arr.splice(i, 1)[0];
}

export function sliceRemove(arr: Node[], i: number) {
    return arr.slice(0, i).concat(arr.slice(i + 1));
}

export const enum FixedState {
    NoOptimizations, AllFixed, SomeNotFixed
}

let fixedState = FixedState.NoOptimizations;

export function getFixedState() {
    return fixedState;
}

export function print(node: Node, message: string, autoFixed: boolean) {
    message = formatLoc(node) + ': ' + message;
    if (autoFixed) {
        console.log('fixed: ' + message);
        if (fixedState === FixedState.NoOptimizations) {
            fixedState = FixedState.AllFixed;
        }
    } else {
        console.log('NOT fixed: ' + message);
        fixedState = FixedState.SomeNotFixed;
    }
}

export function formatLoc({ loc }: Node) {
    if (loc) {
        return `line ${loc.start.line} col ${loc.start.column} to line ${loc.end.line} col ${loc.end.column}`;
    }
    return `<no location info>`;
}