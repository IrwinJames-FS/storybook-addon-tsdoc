/*
Signature Naming

While plain text is a readable method if fails to provide the appropriate information for each name at first glance. instead it seems providing a full signature to each component within the name is the most appropriate method... what does this mean however

take the following object for example

const Test: {
	getName({name, maternal, paternal}: {
		name: string
		maternal: SomeOtherObject,
		paternal: SomeOtherObject,
	}):{
		name: string,
		lineage(options:{
			branches: 'paternal' | 'maternal' | 'both'
		});
	}
} = {...}

This just an example of how anonymous objects can be abused to create something difficult to document.

If I were to use simple dot notation to symbolize these nodes I would encounter conflicts with name as it exists with the same syntax multiple times

Test.getName.name (the function argument property)
Test.getName.name (the function return value property)

It should be noted that vsCode resolves this be resolving destructuring to an any argument called prop. 
I think having a method that better at differenciating such things.
*/

import { getFullName, getName } from "./node-tools"
import { Node } from "ts-morph"
import TS from "./TS"
import { bySyntax } from "./SyntaxKindDelegator";
import SK, { SKindMap, SyntaxKindMap } from "./SyntaxKindDelegator.types";
import { $literal, $name, $type } from "./decorators";

/**
 * Evaluates the signature and generates a reduced version of the signature
 * @param node 
 * @param child 
 */
const collapsedSig = (node: Node, child: Node) => {
	const name = getName(node);
	return name;
}
/**
 * This method wil be responsible for creating the signature
 * @param node 
 */
const sig = (node: Node) => {
	return getFullName(node);
}

const typingMap: SKindMap<string> = {
	[SK.TypeAliasDeclaration]: (node, df)=>{
		const typeNode = node.getTypeNode();
		if(!typeNode) return df(node)
		return ': ' + bySyntax(typeNode, typingMap, df);
	},
	[SK.LiteralType]: (node)=>$literal(node.getText()),
	[SK.TupleType]: (node, df)=>`[${node.getElements().map(e=>bySyntax(e, typingMap, df)).join(', ')}]`,
	[SK.UnionType]: (node, df)=>node.getTypeNodes().map(e=>bySyntax(e, typingMap, df)).join(' | '),
	[SK.IntersectionType]: (node, df)=>node.getTypeNodes().map(e=>bySyntax(e, typingMap, df)).join(' & '),
	[SK.NamedTupleMember]: (node, df)=>`${$name(node.getName())}: ${bySyntax(node.getTypeNode()!, typingMap, df)}`,
	[SK.ArrayType]: (node, df)=>`${bySyntax(node.getElementTypeNode(), typingMap, df)}[]`,
}
/**
 * Once a full signature name is resolved the typing of the object will be necessary. This typing however will be different for different declaration type. As such I will be handling these similar to the SyntaxKind... I need a SyntaxKind switching function
 * @param node 
 */
const typing = (node: Node) => {
	return bySyntax(node, typingMap, n=>$type(n.getText()));
}
/**
 * Traverse the nodes leading to this node and create a styled name using special notation.
 * @param node 
 */
export const getSignature = (node: Node) => {
	return `${sig(node)}${typing(node)}`;
}