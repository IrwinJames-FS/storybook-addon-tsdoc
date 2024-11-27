import { Node } from "ts-morph";

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

export const getSignature = (node: Node) => {
	return `<span className="ts-doc-kind">${node.getKindName()}</span> ${getName(node)}`
}
/**
 * Gets a / delimited list of names from source to current node
 * @param node 
 * @returns 
 */
export const getFullName = (node: Node, delim:string=".") => {
	const family = getFamilyName(node, delim);
	return [family, getName(node)].filter(a=>a).join(delim);
}

export const getSignatureName = (node:Node, delim:string=".") => {
	const family = getFamilyName(node, delim);
	return `<span className="ts-doc-kind">${node.getKindName()}</span> ${[family, getName(node)].filter(a=>a).join(delim)}`;
}
/**
 * Converts the ancestors into a family name.
 * @param node 
 * @returns 
 */
export const getFamilyName = (node: Node, delim:string=".") => node.getAncestors().map(a=>getName(a)).filter(a=>a).reverse().join(delim);

/**
 * Checks to see if the Node is primitive
 * @param node 
 * @returns 
 */
export const isPrimitive = (node?: Node) => node ? (
	Node.isStringKeyword(node)
	|| Node.isStringLiteral(node)
	|| Node.isNumberKeyword(node)
	|| Node.isNumericLiteral(node)
	|| Node.isNeverKeyword(node)
	|| Node.isAnyKeyword(node)
	|| Node.isNullLiteral(node)
	|| Node.isBigIntLiteral(node)
	|| Node.isBooleanKeyword(node)
	|| Node.isTrueLiteral(node)
	|| Node.isFalseLiteral(node)
	|| Node.isLiteralTypeNode(node)
): false;