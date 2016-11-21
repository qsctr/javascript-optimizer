import * as AST from 'estree';

export default function (node: AST.Node) {
    if (node.type === 'BlockStatement' || node.type === 'Program') {
        while (true) {
            const index = (node.body as AST.Statement[]).findIndex(x => x.type === 'EmptyStatement');
            if (index === -1) {
                return;
            }
            (node.body as AST.Statement[]).splice(index, 1);
        }
    }
}