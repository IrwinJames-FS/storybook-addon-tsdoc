import { Node, TypeNode, TypeReferenceNode } from "ts-morph";
import { DeclarationType, Nameable } from "./types";
import { join, relative } from "path";
import TS from "./TS";
import { minimatch } from "minimatch";
import { yellow } from "console-log-colors";

/**
 * Checks if a node has a get Node method
 * @param node 
 * @returns 
 */
export const hasName = (node: Node): node is Nameable => 'getName' in node && typeof node.getName === 'function';

/**
 * Gets a name if one exists
 * @param node 
 */
export const getName = (node: Node): string | undefined => Node.hasName(node) ? node.getName()
: Node.isConstructorDeclaration(node) ? 'constructor'
: undefined

export const getFamilyName = (node: Node, delim:string='/') => node.getAncestors()
.reverse()
.slice(1)
.flatMap(a=>[getName(a)])
.join(delim);
/**
 * Get the full name by climbing the nodes parent tree.
 * @param node 
 * @param delim 
 * @returns 
 */
export const getFullName = (node: Node, delim?:string): string | undefined => {
	const familyName = getFamilyName(node);
	const name = getName(node);

	return name ? familyName ? familyName+'-'+getName(node):getName(node):familyName;
}
/**
 * Get the nodes origin file.
 * relative mode assumes the node is within the project
 * @param node 
 * @returns 
 */
export const getFilePath = (node: Node, relative:boolean=false): string => node.getSourceFile()
.getFilePath()
.slice(relative ? TS.cwd.length+1:0)
/**
 * Gets the file path of the documentation
 * @param node 
 * @returns 
 */
export const getDocPath = (node: Node, relative: boolean=false): string | undefined => {
	let fp = getFilePath(node, true) //drop the .ts extension
	//determine which entry the doc came frome
	const entry = TS.entries.find(e=>minimatch(fp, e));
	if(!entry) return; //outside of docs scope
	for(const [pattern, alias] of TS.aliases) {
		fp = fp.replace(pattern, alias)
	}
	const fullName = getFullName(node);

	return join(...[relative ? '':TS.docPath, fp.slice(0,-3).replace(/\//g, '-')+(fullName ? '-'+fullName:'')+'.mdx'].filter(d=>!!d));
}

export const getDocLink = (node: Node):string | undefined => {
	const p = getDocPath(node, true);
	if(!p) return;
	return ('/docs/'+p.slice(0,-4)+'--docs').toLowerCase();
}

export const isPrimitiveTypeNode = (node: TypeNode): boolean => Node.isStringKeyword(node) 
|| Node.isStringLiteral(node) 
|| Node.isNumberKeyword(node) 
|| Node.isNumericLiteral(node)
|| Node.isBooleanKeyword(node)
|| Node.isTrueLiteral(node)
|| Node.isFalseLiteral(node)
|| Node.isAnyKeyword(node) 
|| Node.isNullLiteral(node) 
|| Node.isNeverKeyword(node)
|| Node.isUndefinedKeyword(node)
|| Node.isInferKeyword(node)
|| Node.isSymbolKeyword(node)
|| Node.isLiteralTypeNode(node)

export const getTypeNode = (node: Node) => Node.isTyped(node) ? node.getTypeNode():undefined;

export const parseTypeReferenceNode = (node: TypeReferenceNode) => {
	const typeName = node.getTypeName();
	const name = typeName.getText();
	const src = Node.isIdentifier(typeName) ? typeName.getImplementations()[0]?.getNode():undefined
	const href = src ? getDocLink(src):undefined
	const typeArguments = node.getTypeArguments().map(parseTypeFromTypeNode).join(', ');
	return (href ? `[${name}](${href})`:name)+(typeArguments ? '&lt;'+typeArguments+'&gt;':'');
}
export const parseTypeFromTypeNode = (node: TypeNode):string | undefined => isPrimitiveTypeNode(node) ? node.getText()
: Node.isTypeLiteral(node) ? '&lcub;...&rcub;'
: Node.isTupleTypeNode(node) ? `[${node.getElements().map(parseTypeFromTypeNode).join(', ')}]`
: Node.isNamedTupleMember(node) ? `${node.getName()}: ${parseTypeFromTypeNode(node.getTypeNode())}`
: Node.isUnionTypeNode(node) ? node.getTypeNodes().map(parseTypeFromTypeNode).join(' | ')
: Node.isIntersectionTypeNode(node) ? node.getTypeNodes().map(parseTypeFromTypeNode).join(' & ')
: Node.isArrayTypeNode(node) ? parseTypeFromTypeNode(node.getElementTypeNode())+'[]'
: Node.isTypeReference(node) ? parseTypeReferenceNode(node)
: TS.log(yellow(node.getKindName()));

export const getTypeFromTypeNode = (node: Node): string | undefined => {
	const typeNode = getTypeNode(node);
	if(!typeNode) return;
	return parseTypeFromTypeNode(typeNode);
}

export const getType = (node: Node):string => getTypeFromTypeNode(node) ?? ''; //for now but will add fallback support soon.
