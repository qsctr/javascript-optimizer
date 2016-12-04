import { Node } from 'estree';

type Optimization = (node: Node) => boolean;

export default Optimization;