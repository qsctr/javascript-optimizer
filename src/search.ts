import * as AST from 'estree';

export default (node: AST.Node, optimize: (node: AST.Node) => void) =>
    (function search(node: AST.Node) {
        optimize(node);
        for (const property in node) {
            if (node.hasOwnProperty(property)) {
                if (node[property].hasOwnProperty('type')) {
                    search(node[property]);
                }
                if (Array.isArray(node[property])
                && node[property].length > 0
                && node[property][0].hasOwnProperty('type')) {
                    node[property].forEach(search);
                }
            }
        }
    })(node);