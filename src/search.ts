import { Node, Program } from 'estree';
import { Optimization } from './optimizations';
import { loopChildren } from './utils';

export default (program: Program, optimize: Optimization) =>
    (function search(node: Node) {
        if (optimize(node)) {
            loopChildren(node, search);
        }
    })(program);