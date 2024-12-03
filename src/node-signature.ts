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

import { getDocPath, getFName, getFullName, getName, isPrimitive } from "./node-tools"
import { Node } from "ts-morph"
import { bySyntax } from "./SyntaxKindDelegator";
import SK, { SKindMap } from "./SyntaxKindDelegator.types";
import { $href, $literal, $name, $type } from "./decorators";
import { gray, yellow } from "console-log-colors";
import { Nodely } from "./types";
import TS from "./TS";
import { typelit } from "./constants";


const typingMap: SKindMap<string> = {
	[SK.TypeAliasDeclaration]: (node, df)=>{
		const params = node.getTypeParameters()?.map(p=>sig(p)).join(', ').wrap('<','>') ?? '';
		const typeNode = node.getTypeNode();
		if(!typeNode) return df(node)
		return params+': ' + sig(typeNode);
	},
	[SK.LiteralType]: node=>$literal(node.getText()),
	[SK.TupleType]: node=>`[${node.getElements().map(e=>sig(e)).join(', ')}]`,
	[SK.UnionType]: node=>node.getTypeNodes().map(e=>sig(e)).join(' | '),
	[SK.IntersectionType]: node=>node.getTypeNodes().map(e=>sig(e)).join(' & '),
	[SK.NamedTupleMember]: node=>`${$name(node.getName())}: ${sig(node.getTypeNode()!)}`,
	[SK.ArrayType]: node=>`${sig(node.getElementTypeNode())}[]`,
	[SK.TypeReference]: node=>{ //this is a tricky one
		const typeName = node.getTypeName();
		const args = node.getTypeArguments();
		//corner cases
		if(typeName.getText() === "Array"){
			return sig(args[0])+"[]";
		}

		return sig(typeName) + (args.length ? args.map(a=>sig(a)).join(', ').wrap('<','>'):'')
	},
	[SK.Identifier]: node=>{
		const def = node.getDefinitionNodes()[0]; //I guess its possible to have multiple definitions but I havent thought of a use case where I would have reference to all definitions in one location (extensions would have a link back to immediate source automatically)
		if(!def) return $type(node.getText()); //no link
		const href = getDocPath(def)
		if(!href) return $type(node.getText()); //link outside scope
		return $href(node.getText(), href);
	},
	[SK.TypeParameter]: node => {
		const extension = node.getConstraint()
		return $name(node.getName()) + (extension ? ' extends ' + sig(extension):'');
	},
	[SK.TypeLiteral]: ()=>$type('&lcub;...&rcub;'),
	[SK.PropertySignature]: node=>sig(node.getTypeNode()),
	[SK.MethodSignature]: node=>{
		return `(${node.getParameters().map(p=>sig(p)).join(', ')}): ${sig(node.getReturnTypeNode())}`;
	},
	[SK.Parameter]: node=>{
		const typeNode = node.getTypeNode();
		return `${$name((node.isRestParameter() ? '...':'')+node.getName())}: ${sig(typeNode)}`;
	},
	[SK.FunctionType]: node=>{
		return `(${node.getParameters().map(p=>sig(p)).join(', ')}) =&gt; ${sig(node.getReturnTypeNode())}`;
	},
	[SK.MethodDeclaration]: node=>{
		return `(${node.getParameters().map(p=>sig(p)).join(', ')}) =&gt; ${sig(node.getReturnTypeNode())}`;
	},
	[SK.ParenthesizedType]: node=>`(${sig(node.getTypeNode())})`,
	[SK.ClassDeclaration]: node=>{
		const extensions = sig(node.getExtends());
		const implementions = node.getImplements().map(i=>sig(i)).join(', ');
		console.log(node.getImplements().length);
		return `${extensions ? ' extends '+ extensions:''}${implementions ? ' implements ' + implementions:''}`
	},
	[SK.ExpressionWithTypeArguments]: node=>{
		const args = node.getTypeArguments().map(a=>sig(a)).join(', ');
		return `${sig(node.getExpression())}${args.wrap('<','>')}`
	},
	[SK.InterfaceDeclaration]: node=>$literal(typelit)
}
const defSig = (n: Nodely)=>{
	if(!n) return '';
	if(isPrimitive(n)) return $type(n.getText());
	TS.err("Signature Missing type", yellow(n.getKindName()), gray(getFullName(n)));
	return $type(n.getText())
}
const sig = (node: Nodely) => bySyntax(node, typingMap, defSig);
/**
 * Once a full signature name is resolved the typing of the object will be necessary. This typing however will be different for different declaration type. As such I will be handling these similar to the SyntaxKind... I need a SyntaxKind switching function
 * @param node 
 */
export const getSignature = (node: Nodely) => sig(node);