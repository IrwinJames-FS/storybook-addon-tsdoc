import { getFullName, isPrimitive } from "./node-tools";
import { bySyntax } from "./SyntaxKindDelegator";
import SK from "./SyntaxKindDelegator.types";
import { $type } from "./decorators";
import { gray, yellow } from "console-log-colors";
import { Nodely } from "./types";
import TS from "./TS";
import { nodeSignatureMap } from "./node-signature-map";

/**
 * A list of types to be ignored... perhaps I should build this into bySyntax
 */
const Ignores = new Set([
	SK.MultiLineCommentTrivia
]);

/**
 * Just a convenience method to make the same bySyntax method reusable. 
 * @param node 
 * @returns 
 */
export const sig = (node: Nodely) =>  (!!node && !Ignores.has(node.getKind())) ? bySyntax(node, nodeSignatureMap, (n: Nodely)=>{
	if(!n) return '';
	if(isPrimitive(n)) return $type(n.getText());

	TS.err("Signature Missing type", yellow(n.getKindName()), gray(getFullName(n)), n.getText());
	return "";
}):'';

/**
 * Once a full signature name is resolved the typing of the object will be necessary. This typing however will be different for different declaration type. As such I will be handling these similar to the SyntaxKind... I need a SyntaxKind switching function
 * @todo this is unecessary these functions arent public. 
 * @param node 
 */
export const getSignature = (node: Nodely) => {
	return sig(node);
}

