import { Node, Type } from "ts-morph";
import TS from "./TS";
import { bySyntax } from "./SyntaxKindDelegator";
import SK, { SKindMap } from "./SyntaxKindDelegator.types";
import { cyan, green } from "console-log-colors";
import { Nodely } from "./types";
import { createPrinter, createSourceFile, ScriptKind, ScriptTarget } from "typescript";
import { escape } from "./utils";
interface Nameable extends Node {
	getName():string
}

/**
 * Because there isnt a standard way to mark something private.
 * @param node 
 * @returns 
 */
export const isPrivate = (node: Nodely) => {
	if(!node) return true; //must be private its so private it doesnt exist.

	//check if the node has a private modifier (typescript syntax sugar)
	return (Node.isModifierable(node) && node.hasModifier(SK.PrivateKeyword))
	//check if there is a private tag in jsdocs
	|| (Node.isJSDocable(node) && node.getJsDocs().some(d=>d.getTags().some(t=>t.getTagName().toLowerCase() === 'private')))
}
/**
 * Check if a node has getName method
 * @param node 
 * @returns 
 */
const hasName = <T extends Node>(node: T): node is T & Nameable => 'getName' in node 
&& typeof node.getName === 'function'
&& !Node.isParameterDeclaration(node)

/**
 * Get a nodes name if one is available
 * @param node 
 * @returns 
 */
export const getName = <T extends Node>(node: Nodely<T>):string => (node && hasName(node)) ? escape(node.getName())
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

export const getJsDocs = (node: Node) => Node.isJSDocable(node) ? node.getJsDocs():[];


export const getComments = (node: Node) => (Node.isJSDocable(node) ? node.getJsDocs():[]).map(j=>j.getComment()).join('\n')+'\n';
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

export const getTypeNode = (node?: Node) => Node.isTyped(node) ? node.getTypeNode()
	//: (Node.isInitializerExpressionGetable(node) || Node.isInitializerExpressionable(node)) ? node.getInitializer()
	: undefined;
/**
 * In some cases the named node is the parent node of the evaluated node this just climbs the node tree until it finds a name
 * @param node 
 */
export const getNearestName = (node?: Node) => {
	let name = getName(node);
	while (node && !name){
		node = node.getParent()
		name = getName(node)
	}
	return name;
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
	const fn = getFullName(node, '')
	return TS.resolveDocPath(ref)+(fn ? '#'+fn.toLowerCase():'')
}

/**
 * With there being 4 to 5 different method like declarations it seems like a good way to reduce redundant code. 
 * @param node 
 * @returns 
 */
export const isMethodLike = (node?: Node): boolean => {
	if(!node) return false;
	const k = node.getKind();
	return new Set<SK>([
		SK.MethodSignature,
		SK.MethodDeclaration,
		SK.FunctionType
	]).has(k);
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
		SK.UndefinedKeyword,
		SK.UnknownKeyword,
		SK.ExportAssignment, //Just to ignore the warning it wont be used at this stage.
		SK.ImportDeclaration
	]).has(k);
}

export const getExample = (node: Node) => {
	const examples = getJsDocs(node).flatMap(d=>d.getTags().filter(t=>t.getTagName()==="example").map(t=>t.getComment() as string));
	return examples.map(renderCode).join('\n');
}


export const renderCode = (code: string) => code ? `\`\`\`ts\n${createPrinter({removeComments: false}).printFile(createSourceFile("t.ts", code, ScriptTarget.Latest, false, ScriptKind.TS))}\n\`\`\``:'';

export const isStatic = (node: Node) => {
	if(!Node.isStaticable(node)) return false;
	return node.isStatic();
}

/**
 * attempt to get a Node from the type declaration
 * @param type
 */
export const declarationOfType = (type: Type, onlyAnonymous: boolean=false) => {
	if(onlyAnonymous && !type.isAnonymous()) return; 
	const [symbolDec] = type.getSymbol()?.getDeclarations() ?? [];
	const [aliasDec] = type.getAliasSymbol()?.getDeclarations() ?? [];

	console.log(type.getText(), type.isAnonymous(), !!symbolDec, !!aliasDec);
	return symbolDec ?? aliasDec;
}