import TS from "./TS";
import { Node } from "ts-morph";
import { $kind } from "./decorators";
import { getSKInfo, SKMap } from "./SKMap";

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
	return `<span className="ts-doc-kind">${getKind(node)}</span> ${[family, getName(node)].filter(a=>a).join(delim)}`;
}
/**
 * Converts the ancestors into a family name.
 * @param node 
 * @returns 
 */
export const getFamilyName = (node: Node, delim:string=".") => node.getAncestors().map(a=>getName(a)).filter(a=>a).reverse().join(delim);


export const getKind = (node: Node): string | undefined => {
	//const walker = SyntaxWalkers[node.getKind()];
	const walker = getSKInfo(node);
	if(!walker || !walker.kind) {
		TS.err("Kind not supported", node.getKindName());
		return;
	}
	return $kind(walker.kind);
}
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




