import { Syntax } from 'esprima';
import { Node } from 'estree';

export function loopChildren(node: Node, func: (node: Node) => Node | void) {
    for (const prop in node) {
        if (node.hasOwnProperty(prop)) {
            if (isNode(node[prop])) {
                const res = func(node[prop]);
                if (res) {
                    node[prop] = res;
                }
            }
            if (Array.isArray(node[prop]) && node[prop].length && isNode(node[prop][0])) {
                for (let i = 0; i < node[prop].length; i++) {
                    const res = func(node[prop][i]);
                    if (res) {
                        node[prop][i] = res;
                    }
                }
            }
        }
    }
}

function isNode(object: Object) {
    if (object.hasOwnProperty('type')) {
        for (const type in Syntax) {
            if ((object as { type: string }).type === type) {
                return true;
            }
        }
    }
    return false;
}