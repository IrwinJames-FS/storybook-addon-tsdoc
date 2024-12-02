import { Node } from "ts-morph";
import { bySyntax } from "./SyntaxKindDelegator";
import SK, { SKindMap, SyntaxKindMap } from "./SyntaxKindDelegator.types";
import { Nodely } from "./types";
import TS from "./TS";
import { getFullName, isPrimitive } from "./node-tools";
import { red } from "console-log-colors";

interface Traveler{
	kind?: string
	children?: Nodely[]
}
const Traversals: SKindMap<Traveler> = {
	[SK.SourceFile]: node=>({children: [node?.getChildSyntaxList()]}),
	[SK.SyntaxList]: node=>({children: node?.getChildren()}),
	[SK.TypeAliasDeclaration]: node=>({
		kind: 'type',
		children: [...node?.getTypeParameters(),node?.getTypeNode()]
	}),
	//force children to by organized
	[SK.TypeLiteral]: node=>({children: [...node.getProperties(), ...node.getMethods()]}),
	[SK.PropertySignature]: (node=>({children: [node.getTypeNode()], kind: 'property'})),
	[SK.MethodSignature]: (node=>({children: [...node.getParameters(), node.getReturnTypeNode()], kind: 'method'})),
	[SK.ArrayType]: (node=>({children: [node.getElementTypeNode()]})),
	[SK.Parameter]: node=>({children: [node.getTypeNode()]}),
	[SK.TupleType]: node=>({children: node.getElements()}),
	[SK.IntersectionType]: node=>({children: node.getTypeNodes()}),
	[SK.UnionType]: node=>({children: node.getTypeNodes()}),
	[SK.FunctionType]: node=>({children: [...node.getTypeParameters(), ...node.getParameters(), node.getReturnTypeNode()]}),
	[SK.TypeReference]: node=>({children: [node.getTypeName(), ...node.getTypeArguments()]}),
	[SK.NamedTupleMember]: node=>({children: [node.getTypeNode()]}),
	[SK.Identifier]: node=>({}),
	[SK.TypeParameter]: node=>({children:[node.getConstraint()]}),
	[SK.ParenthesizedType]: node=>({children: [node.getTypeNode()]})
}
/**
 * Traverse sources by syntax
 * @param nodes 
 */
export function* traverse(...nodes:Nodely[]):Generator<[kind: string, node: Node]>{
	for(const node of nodes){
		if(!node) return;
		const {kind, children} = bySyntax<Traveler>(node, Traversals, n=>{
			if(!n) return {};
			if(!isPrimitive(n)) TS.err("Unsupported kind", getFullName(n), red(n.getKindName()));
			return {};
		});
		if(kind) yield [kind, node];
		if(children && children.length) yield* traverse(...children);
	}
}