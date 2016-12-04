import { Syntax } from 'esprima';
import { Node, BlockStatement } from 'estree';
import { Optimization, Action } from './optimizations';

export function search(optimize: Optimization) {
    return (node: Node): Action => {
        if (optimize(node)) {
            return loopChildren(node, search(optimize));
        }
        return Action.Stop;
    }
}

function loopChildren(node: Node, func: (node: Node) => Node | Action | void) {
    for (const prop in node) {
        if (node.hasOwnProperty(prop)) {
            let arr: Node[] | null = null;
            if (isNode(node[prop])) {
                arr = [node[prop]];
            } else if (Array.isArray(node[prop])
            && node[prop].length && isNode(node[prop][0])) {
                arr = node[prop];
            }
            if (arr) {
                for (let i = 0; i < arr.length; i++) {
                    const res = func(arr[i]);
                    if (typeof res === 'number') {
                        if (res === Action.Stop) {
                            return Action.Stop;
                        }
                    } else if (res) {
                        arr[i] = res;
                    }
                }
            }
        }
    }
    return Action.Continue;
}

function isNode(object: Object): object is Node {
    if (object && object.hasOwnProperty('type')) {
        for (const type in Syntax) {
            if ((object as { type: string }).type === type) {
                return true;
            }
        }
    }
    return false;
}

export const removeFromBlockIf = removeFromBlockIfGeneric(getBlock);

export const removeFromFunctionBlockIf = removeFromBlockIfGeneric(getFunctionBlock);

function removeFromBlockIfGeneric(blockFunc: (node: Node) => Node[] | null) {
    return (pred: (node: Node, i: number, block: Node[]) => boolean, message: string): Optimization => {
        return node => {
            const block = blockFunc(node);
            if (block) {
                for (let i = 0; i < block.length;) {
                    if (pred(block[i], i, block)) {
                        print(remove(block, i), message);
                    } else {
                        i++;
                    }
                }
            }
            return Action.Continue;
        };
    };
}

export function replaceChildIf(pred: (node: Node) => boolean, newChild: Node, message: string): Optimization {
    return node => {
        loopChildren(node, child => {
            if (pred(child)) {
                print(child, message);
                return newChild;
            }
        });
        return Action.Continue;
    };
}

export function getBlock(node: Node) {
    switch (node.type) {
        case 'Program':
        case 'BlockStatement':
            return node.body;
        case 'SwitchCase': // meta switch case
            return node.consequent; // meta consequent
    }
    return null;
}

export function getFunctionBlock(node: Node) {
    if (isBlockFunction(node)) {
        return (node as { body: BlockStatement }).body.body;
    }
    return null;
}

function isBlockFunction(node: Node) {
    return node.type === 'FunctionDeclaration'
        || node.type === 'FunctionExpression'
        || (node.type === 'ArrowFunctionExpression' && node.body.type === 'BlockStatement');
}

export function isPureExpression(node: Node) {
    return node.type === 'ThisExpression'
        || node.type === 'Literal'
        || node.type === 'Identifier';
}

export function remove(arr: Node[], i: number) {
    return arr.splice(i, 1)[0];
}

export function sliceRemove(arr: Node[], i: number) {
    return arr.slice(0, i).concat(arr.slice(i + 1));
}

export function print({ loc }: Node, message: string) {
    if (loc) {
        console.log(`line ${loc.start.line} col ${loc.start.column} to line ${loc.end.line} col ${loc.end.column}: ${message}`);
    } else {
        console.log(`<no location info>: ${message}`);
    }
}