import { Syntax } from 'esprima';
import { Node } from 'estree';
import { Optimization } from './optimizations';

export default (node: Node, optimize: Optimization) =>
    (function search(node: Node) {
        while (true) {
            const result = optimize(node);
            if (!result) break;
            const [{ loc }, message] = result;
            if (!loc) continue;
            console.log(`line ${loc.start.line} col ${loc.start.column} to line ${loc.end.line} col ${loc.end.column}: ${message}`);
        }
        for (const property in node) {
            if (node.hasOwnProperty(property)) {
                const child = node[property];
                if (isNode(child)) {
                    search(child);
                }
                if (Array.isArray(child) && child.length && isNode(child[0])) {
                    child.forEach(search);
                }
            }
        }
    })(node);

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