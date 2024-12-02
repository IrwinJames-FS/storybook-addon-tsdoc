import { Node } from "ts-morph";
import TS from "./TS";
import { bySyntax } from "./SyntaxKindDelegator";
import SK, { SKindMap } from "./SyntaxKindDelegator.types";
import { cyan, green, red } from "console-log-colors";
import { typelit } from "./constants";

interface Nameable extends Node {
	getName():string
}
/**
 * Check if a node has getName method
 * @param node 
 * @returns 
 */
const hasName = <T extends Node>(node: T): node is T & Nameable => 'getName' in node 
&& typeof node.getName === 'function';

/**
 * Get a nodes name if one is available
 * @param node 
 * @returns 
 */
export const getName = <T extends Node>(node: T):string => hasName(node) ? node.getName()
:'';


/**
 * Gets a / delimited list of names from source to current node
 * @param node 
 * @returns 
 */
export const getFullName = (node: Node, delim:string=".") => {
	const family = getFamilyName(node, delim);
	return [family, getName(node)].filter(a=>a).join(delim);
}

/**
 * Gets the signature of a declaration. 
 * @param node 
 * @param delim 
 * @returns 
 */
export const getSignatureName = (node:Node, delim:string=".") => {
	const family = getFamilyName(node, delim);
	return `${[family, getName(node)].filter(a=>a).join(delim)}`;
}

export const getComments = (node: Node) => (Node.isJSDocable(node) ? node.getJsDocs():[]).map(j=>j.getComment()).join('\n');
/**
 * Converts the ancestors into a family name.
 * @param node 
 * @returns 
 */
export const getFamilyName = (node: Node, delim:string=".") => node.getAncestors().map(a=>getName(a)).filter(a=>a).reverse().join(delim);

type Modificator = [pre: string, post: string, children: Node[]];
const ModMap: SKindMap<Modificator> = {
	[SK.TypeAliasDeclaration]:(node)=>[node.getName(), '', []],
	[SK.PropertySignature]:(node, df)=>{
		const [pre, post] = bySyntax(node.getParent(), ModMap, df);
		return [pre+'.'+node.getName(), post, []];
	},
	[SK.TypeLiteral]: (node, df)=>{
		const parent = node.getParent()
		const [pre, post, children] = bySyntax(parent, ModMap, df);
		return [pre+(children.length > 1 ? '.'+children.findIndex(c=>c===node):''), post, []]
	},
	[SK.UnionType]: (node, df)=>{
		const [pre, post] = bySyntax(node.getParent(), ModMap, df);
		return [pre, post, node.getTypeNodes()];
	},
	[SK.TypeParameter]: (node, df)=>{
		const [pre, post] = bySyntax(node.getParent(), ModMap, df)
		return [pre+'.'+node.getName(),post, []];
	},
	[SK.Parameter]: (node, df)=>{
		const [pre, post] = bySyntax(node.getParent(), ModMap, df);
		return [pre+'.'+node.getName(), post, []];
	},
	[SK.FunctionType]: (node, df) => {
		const [pre, post] = bySyntax(node.getParent(), ModMap, df)
		return [pre, post, []];
	}
}


export const getFName = (node: Node) => {
	const [pre,post] = bySyntax(node, ModMap, n=>{
		if(!n) return ['','', []]
		TS.warn(cyan(n.getKindName()));
		return ['', '', []]
	})
	const nm = pre+post;
	if(nm){
		TS.success("FName", green(nm));
		return nm;
	}
	return getFullName(node);
}
/**
 * Gets the source of the node and returns a storybook formatted link to the documentation of said node if the node exists within the scope provided by the entry point.
 * @param node 
 */
export const getDocPath = (node: Node): string | undefined => {
	const src = node.getSourceFile().getFilePath();
	const ref = TS.resolveUrl(src)
	if(!ref) return;
	const fn = getFullName(node)
	return TS.resolveDocPath(ref)+(fn ? '#'+fn.toLowerCase():'')
}

/**
 * Checks to see if the Node is primitive
 * 
 * update: using Kind value is simpler response as I am not confirming a specific type.
 * @param node 
 * @returns 
 */
export const isPrimitive = (node?: Node):boolean => {
	if(!node) return false;
	const k = node.getKind();
	return new Set<SK>([
		SK.AnyKeyword,
		SK.StringKeyword,
		SK.StringLiteral,
		SK.NumberKeyword,
		SK.NumericLiteral,
		SK.BooleanKeyword,
		SK.TrueKeyword,
		SK.FalseKeyword,
		SK.BigIntKeyword,
		SK.BigIntLiteral,
		SK.LiteralType,
		SK.NullKeyword,
		SK.NeverKeyword,
		SK.VoidKeyword,
		SK.UndefinedKeyword
	]).has(k);
}


