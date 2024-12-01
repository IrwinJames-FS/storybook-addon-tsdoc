import { Node } from "ts-morph";
import { bySyntax } from "./SyntaxKindDelegator";
import SK, { SKindMap, SyntaxKindMap } from "./SyntaxKindDelegator.types";
import { Nodely } from "./types";
import TS from "./TS";

interface Traveler{
	kind?: string
	children?: Nodely[]
}
const Traversals: SKindMap<Traveler> = {
	[SK.SourceFile]: node=>({children: [node?.getChildSyntaxList()]}),
	[SK.SyntaxList]: node=>({children: node?.getChildren()}),
	[SK.TypeAliasDeclaration]: node=>({
		kind: 'type',
		children: [node?.getTypeNode()]
	}),
	//force children to by organized
	[SK.TypeLiteral]: node=>({children: [...node.getProperties(), ...node.getMethods()]}),
	[SK.PropertySignature]: (node=>({children: [node.getTypeNode()], type: 'property'})),
	[SK.MethodSignature]: (node=>({children: [...node.getParameters(), node.getReturnTypeNode()]})),
}
/**
 * Traverse sources by syntax
 * @param nodes 
 */
export function* traverse(...nodes:Nodely[]):Generator<[kind: string, node: Node]>{
	for(const node of nodes){
		if(!node) return;
		const {kind, children} = bySyntax<Traveler>(node, Traversals, n=>{
			TS.err("Unsupported kind", n.getKindName());
			return {};
		});
		if(kind) yield [kind, node];
		if(children && children.length) yield* traverse(...children);
	}
}