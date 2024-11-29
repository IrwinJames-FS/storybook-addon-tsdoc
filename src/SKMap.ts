import { IntersectionTypeNode, Node, SyntaxKind as SK, UnionTypeNode } from "ts-morph";
import { Nodely } from "./types";
import TS from "./TS";

export type SKHandler<T extends Node = Node> = (node: T)=>SKInfo | undefined

export type SKValidator<T extends Node> = (node: Nodely)=>node is T;

export interface SKInfo {
	/**
	 * The kind string is just a convenience method the will trigger if a node should be rendered as a declaration.
	 */
	kind?: string

	/**
	 * A children array which will be used by the walk iterator
	 */
	children: Nodely[]
}

type SKMap = {
	[k in SK]?: SKMapObject
}

export interface SKMapObject {
	handler: SKHandler,
	delimiter?: string
}

export const SKH = <T extends Node>(validate: SKValidator<T>, handler: SKHandler<T>, {delimiter}: Omit<SKMapObject, "handler">={}):SKMapObject => ({
	handler(node: Node){
		if (!validate(node)) return;
		return handler(node);
	},
	delimiter
});

const childrenFromTypeNodes = (node: UnionTypeNode | IntersectionTypeNode)=>({
	children: node.getTypeNodes()
});

export const SKMap: SKMap = {
	[SK.SourceFile]: SKH(Node.isSourceFile, src=>({
		children: [src.getChildSyntaxList()]
	})),
	[SK.SyntaxList]: SKH(Node.isSyntaxList, list=>({
		children: list.getChildren(),
	})),
	[SK.TypeAliasDeclaration]: SKH(Node.isTypeAliasDeclaration, dec=>({
		kind: 'type',
		children: [dec.getTypeNode()]
	})),
	[SK.TypeLiteral]: SKH(Node.isTypeLiteral, lit=>({
		children: lit.getMembers()
	})),
	[SK.TupleType]: SKH(Node.isTupleTypeNode, tup=>({
		children: tup.getElements()
	})),
	[SK.UnionType]: SKH(Node.isUnionTypeNode, childrenFromTypeNodes, {delimiter: ' | '}),
	[SK.IntersectionType]: SKH(Node.isIntersectionTypeNode, childrenFromTypeNodes, {delimiter: ' &amp; '})
}

/**
 * Just a list of primitive to not report as lacking support without defining a handler
 */
export const SKPrimitives: Set<SK> = new Set([
	SK.StringKeyword,
	SK.StringLiteral,
	SK.NumberKeyword,
	SK.AnyKeyword,
	SK.UnknownKeyword,
	SK.Unknown,
	SK.NumericLiteral,
	SK.BigIntKeyword,
	SK.BigIntLiteral,
	SK.NeverKeyword,
	SK.NullKeyword,
	SK.BooleanKeyword,
	SK.TrueKeyword,
	SK.FalseKeyword,
	SK.TypeReference,
	SK.LiteralType
]);


export const getSKInfo = (node: Node): SKInfo | undefined => {
	const k = node.getKind();
	const {handler} = SKMap[k] ?? {};
	if(!handler) {
		if(!SKPrimitives.has(k)) TS.err("Unsupported type", node.getKindName());
		return;
	}
	return handler(node);
}

export function* walk(...nodes: Nodely[]): Generator<Node> {
	for(const node of nodes){
		if(!node) continue;
		const info = getSKInfo(node);
		//cant have one without the other but this sil
		if(!info) continue; 
		if(info.kind) yield node;
		yield* walk(...info.children);
	}
}