import { JSDoc, Node, ParameterDeclaration, ParameteredNode, Type } from "ts-morph";
import TS from "./TS";
import { bySyntax } from "./SyntaxKindDelegator";
import SK, { SKindMap } from "./SyntaxKindDelegator.types";
import { cyan, green } from "console-log-colors";
import { Nodely } from "./types";
import { createPrinter, createSourceFile, ScriptKind, ScriptTarget } from "typescript";
import { escape } from "./utils";
import { $kd, $t } from "./decorators";
import { getSignature } from "./node-signature";
interface Nameable extends Node {
	getName():string
}

/**
 * Because there isnt a standard way to mark something private.
 * @param node 
 * @returns 
 */
export const isPrivate = (node: Nodely):boolean => !node 
|| (Node.isModifierable(node) && node.hasModifier(SK.PrivateKeyword)) 
|| (Node.isJSDocable(node) && !!node.getJsDocs().find(d=>d.getTags().some(t=>t.getTagName().toLowerCase() === 'private'))) 
|| (Node.isVariableDeclaration(node) && isPrivate(node.getVariableStatement()));
/**
 * Check if a node has getName method
 * @param node 
 * @returns 
 */
const hasName = <T extends Node>(node: T): node is T & Nameable => 'getName' in node 
&& typeof node.getName === 'function'

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
	return [family, (Node.isStaticable(node) && node.isStatic() ? 'static':''),  getName(node)].filter(a=>a).join(delim);
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
export const isKeyword = (node: Nodely) => Node.isAnyKeyword(node) 
|| Node.isInferKeyword(node)
|| Node.isNeverKeyword(node)
|| Node.isNumberKeyword(node)
|| Node.isObjectKeyword(node) //this should probably be handled differently.
|| Node.isStringKeyword(node)
|| Node.isSymbolKeyword(node)
|| Node.isBooleanKeyword(node)
|| Node.isUndefinedKeyword(node);

/**
 * Get the JSDocs if available. 
 * to avoid potential duplicate documentation explicit corner cases should be used.
 * 
 * - variableDeclarations. (the declarations JSDoc should be derived from the statement)
 * @param node 
 * @returns 
 */
export const getJsDocs = (node: Nodely): JSDoc[] => (Node.isJSDocable(node) && node.getJsDocs())
|| (Node.isVariableDeclaration(node) && getJsDocs(node.getVariableStatement()))
|| [];

/**
 * Instead it seems better to just support JSDoc separately from the built in typing. As I integrate properties into the signature process I can omit them from here.
 */
export const OMITTED_TAGS = new Set([
	"example",
	"param",
	"returns"
]);
/**
 * This method is to simplify some of the tag parsing into one place. however with some tags being designed to affect the actual typing in the linter and editor I need to experiment with how these tags effect typescript in different environments.
 * 
 * To be clear this will only parse tags that just need to be displayed but do not effect the typing of the object.
 * @param doc 
 */
export const parseTags = (doc: JSDoc) => doc.getTags().filter(t=>!OMITTED_TAGS.has(t.getTagName())).map(t=>$t(6)`${$kd`&#64;${t.getTagName()}`} ${Node.isJSDocTypeTag(t) ? ' : '+getSignature(t.getTypeExpression()?.getTypeNode()):''} ${t.getCommentText()}`).join('\n');
export const parseDoc = (doc: JSDoc) => {
	const tags = parseTags(doc);
	
	return (doc.getComment() ?? "")+(tags ? '\n\n'+tags+'\n---\n':'');
}
const getParameters = (node: Node) => Node.isParametered(node) ? node.getParameters():[]
const getTags = (node: Node, typeFilter?: string | RegExp) => getJsDocs(node).flatMap(d=>{
	const tags = d.getTags()
	if(typeFilter) return typeFilter instanceof RegExp ? tags.filter(t=>typeFilter.test(t.getTagName())):tags.filter(t=>typeFilter === t.getTagName());
	return tags;
});
const getJSDocParameters = (node: Nodely) => {
	if(!node) return [];
	
	return node ? getTags(node, 'param'):[];
}


const getParameterComment = (node: ParameterDeclaration) => {
	const parent = node.getParent() as Node
	const i = getParameters(parent).findIndex(el=>el===node);
	const param = getJSDocParameters(Node.isExpression(parent) ? parent.getParent():parent)[i];
	return param?.getCommentText() ?? ""; //no parameter index found
}
export const getComments = (node: Nodely):string => (Node.isParameterDeclaration(node) ? getParameterComment(node)
:Node.isVariableDeclaration(node) ? getComments(node.getVariableStatement())
:(Node.isJSDocable(node) ? node.getJsDocs():[]).map(parseDoc).join('\n')+'\n').wrap('','<br/>', false);
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

export const isAsync = (node: Node) => {
	if(!('isAsync' in node) || typeof node.isAsync !== 'function') return false;
	return node.isAsync();
}
export const getTypeNode = (node?: Node) => (Node.isTyped(node) && node.getTypeNode())
	|| ((Node.isInitializerExpressionGetable(node) || Node.isInitializerExpressionable(node)) ? node.getInitializer()
	:undefined)
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
	const fn = getFullName(node, TS.documentStyle === 'file' ? '':'/')
	if(TS.documentStyle === "declaration") return TS.resolveDocPath(ref+'/' + fn); //no need for deeplinking but more explicit naming
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
	return symbolDec ?? aliasDec;
}