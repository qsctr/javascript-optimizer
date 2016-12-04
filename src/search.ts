import { Syntax } from 'esprima';
import { Node } from 'estree';
import Optimization from './optimization';

/**
 * If optimize returns true, the children of the node are searched.
 * If optimize returns false, the search is stopped.
 */
export function search(optimize: Optimization) {
    return (node: Node): boolean => {
        if (optimize(node)) {
            return loopChildren(node, search(optimize));
        }
        return false;
    }
}

/**
 * If func returns Node, the child is set to the return value.
 * If func returns false, loopChildren stops iterating and returns false.
 * If func never returns false, or there are no children, loopChildren returns true.
 * If func is void, loopChildren just iterates through all the children.
 */
export function loopChildren(node: Node, func: (node: Node) => Node | boolean | void) {
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
                    if (typeof res === 'boolean') {
                        if (!res) {
                            return false;
                        }
                    } else if (res) {
                        arr[i] = res;
                    }
                }
            }
        }
    }
    return true;
}

export function isNode(object: Object): object is Node {
    if (object && object.hasOwnProperty('type')) {
        for (const type in Syntax) {
            if ((object as { type: string }).type === type) {
                return true;
            }
        }
    }
    return false;
}