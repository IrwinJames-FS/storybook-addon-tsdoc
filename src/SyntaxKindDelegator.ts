import { SyntaxKindMap, SyntaxKindValidatorMap } from "./SyntaxKindDelegator.types";
import { SyntaxKindDelegator } from "./SyntaxKindMap";
import { Nodely } from "./types";

/**
 * Uses a syntax kind to delegate actions to allow for automatic type based on syntax kind.
 * @param node 
 * @param skMap 
 * @param defaultFN 
 * @returns 
 */
export const bySyntax = <T>(node: Nodely, skMap: Partial<SyntaxKindMap<T>>, defaultFN: (node: Nodely)=>T): T => {
	if(!node) return defaultFN(node);
	const k = node.getKind();
	if(!(k in SyntaxKindDelegator)) {
		return defaultFN(node);
	}
	if(!SyntaxKindDelegator[k as keyof SyntaxKindValidatorMap](node)) return defaultFN(node);
	const entry = skMap[k as keyof SyntaxKindMap<T>];
	if(!entry) return defaultFN(node);
	//@ts-ignore
	return entry(node, defaultFN);
}