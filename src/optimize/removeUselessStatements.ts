import * as AST from 'estree';

const uselessExpressions = [
    'ThisExpression',
    'Literal',
    'Identifier'
];

export default function (node: AST.Node) {
    if (node.type === 'BlockStatement' || node.type === 'Program') {
        while (true) {
            const index = (node.body as AST.Statement[]).findIndex(x => x.type === 'ExpressionStatement' && uselessExpressions.includes(x.expression.type));
            if (index === -1) {
                return;
            }
            (node.body as AST.Statement[]).splice(index, 1);
        }
    }
}