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

import { getDocPath, getFName, getFullName, getName, getTypeNode, isPrimitive } from "./node-tools"
import { Node, Type, TypedNode, TypeOperatorTypeNode } from "ts-morph"
import { bySyntax } from "./SyntaxKindDelegator";
import SK, { SKindMap } from "./SyntaxKindDelegator.types";
import { $href, $kind, $literal, $name, $type } from "./decorators";
import { gray, green, yellow } from "console-log-colors";
import { Nodely } from "./types";
import TS from "./TS";
import { typelit } from "./constants";
function escape(str:string) {
	const htmlEntities = {
	  '<': '&lt;',
	  '>': '&gt;',
	  '&': '&amp;',
	  '"': '&quot;',
	  "'": '&apos;',
	  '/': '&#47;',
	  '\\': '&#92;',
	  '{': '&#123;',
	  '}': '&#125;',
	  '`': '&#96;'
	};
	
	return str.replace(/[<>&"'/\\{}`]/g, char => htmlEntities[char as keyof typeof htmlEntities]);
}

const fromTypeNode = (node: Node): string => {
	const tn = getTypeNode(node);
	return tn ? sig(tn)
	: getSignatureFromType(node) ?? ''
}
const typingMap: SKindMap<string> = {
	[SK.TypeAliasDeclaration]: (node, df)=>{
		const params = node.getTypeParameters()?.map(p=>sig(p)).join(', ').wrap('<','>') ?? '';
		const typeNode = fromTypeNode(node)
		if(!typeNode) return df(node)
		return params+': ' + typeNode;
	},
	[SK.LiteralType]: node=>$literal(node.getText()),
	[SK.TupleType]: node=>{
		return `[${node.getElements().map(e=>sig(e)).join(', ')}]`
	},
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
		if(!def) return '';$type(node.getText()); //no link
		const href = getDocPath(def)
		if(!href) return $type(node.getText()); //link outside scope
		return $href(node.getText(), href);
	},
	[SK.TypeParameter]: node => {
		const extension = node.getConstraint()
		return $name(node.getName()) + (extension ? ' extends ' + sig(extension):'');
	},
	[SK.TypeLiteral]: ()=>$type('&lcub;...&rcub;'),
	[SK.PropertySignature]: fromTypeNode,
	[SK.MethodSignature]: node=>{
		return `(${node.getParameters().map(p=>sig(p)).join(', ')}): ${sig(node.getReturnTypeNode())}`;
	},
	[SK.Parameter]: node=>{
		const typeNode = fromTypeNode(node);
		const initializer = sig(node.getInitializer());
		return `${$name((node.isRestParameter() ? '...':'')+sig(node.getNameNode()))}: ${typeNode}${initializer ? ' = '+initializer:''}`;
	},
	[SK.ArrayLiteralExpression]: node=>'[]',
	[SK.FunctionType]: node=>{
		return `(${node.getParameters().map(p=>sig(p)).join(', ')}) =&gt; ${sig(node.getReturnTypeNode()) || $literal('void')}`;
	},
	[SK.MethodDeclaration]: node=>{
		return `(${node.getParameters().map(p=>sig(p)).join(', ')}) =&gt; ${sig(node.getReturnTypeNode()) || $literal('void')}`;
	},
	[SK.ArrowFunction]: node=>{
		return `(${node.getParameters().map(p=>sig(p)).join(', ')}) =&gt; ${sig(node.getReturnTypeNode()) || $literal('void')}`;
	},
	[SK.ParenthesizedType]: node=>`(${fromTypeNode(node)})`,
	[SK.ClassDeclaration]: node=>{
		const extensions = sig(node.getExtends());
		const implementions = node.getImplements().map(i=>sig(i)).join(', ');
		return `${extensions ? ' extends '+ extensions:''}${implementions ? ' implements ' + implementions:''}`
	},
	[SK.ExpressionWithTypeArguments]: node=>{
		const args = node.getTypeArguments().map(a=>sig(a)).join(', ');
		return `${sig(node.getExpression())}${args.wrap('<','>')}`
	},
	[SK.InterfaceDeclaration]: node=>$literal(typelit),
	[SK.Constructor]: node=>`${$type("new")} (${node.getParameters().map(p=>sig(p)).join(', ')})=>${$type(getName(node.getParent()))}`,
	[SK.GetAccessor]: node=> {
		const rtn = node.getReturnTypeNode();
		return rtn ? sig(rtn)
		: getSignatureFromType(node) ?? ''
	},
	[SK.SetAccessor]: node=> node.getParameters().map(p=>sig(p)).join(', '),
	[SK.ConditionalType]: node => {
		return `${sig(node.getCheckType())} extends ${sig(node.getExtendsType())} ? ${sig(node.getTrueType())}<br/>: ${sig(node.getFalseType())}`;
	},
	[SK.VariableDeclaration]: node => {
		const tn = fromTypeNode(node);
		if(tn) return tn;
		const init = node.getInitializer();
		return sig(init);
	},

	[SK.FunctionExpression]: node => {
		return `(${node.getParameters().map(p=>sig(p)).join(', ')}) =&gt; ${sig(node.getReturnTypeNode()) || $literal('void')}`;
	},
	[SK.ObjectLiteralExpression]: node => $literal('&lcub;...&rcub;'),
	[SK.ObjectBindingPattern]: node => {
		return `&lcub; ... &rcub;`
	},
	[SK.BindingElement]: node => {
		return sig(node.getNameNode())
	},
	[SK.ArrayBindingPattern]: node => {
		return `[${node.getElements().map(n=>sig(n)).join(', ')}]`
	},
	[SK.QualifiedName]: node => {
		return `${sig(node.getLeft())}.${sig(node.getRight())}`;
	},
	[SK.TypePredicate]: node => {
		return `${sig(node.getParameterNameNode())} ${node.hasAssertsModifier() ? sig(node.getAssertsModifier()):'is'} ${sig(node.getTypeNode())}`;
	},
	[SK.TypeOperator]: node => {
		return `${$kind(getOperator(node))} ${sig(node.getTypeNode())}`;
	},
	[SK.BinaryExpression]: node => `${sig(node.getLeft())} ${sig(node.getOperatorToken())} ${sig(node.getRight())}`,

	[SK.PropertyAccessExpression]: node => {
		return `${sig(node.getNameNode())}`;
	},
	[SK.CallExpression]: node => {
		return $type(escape(node.getReturnType().getText())) // todo decode types
	},
	[SK.RestType]: node => `...${sig(node.getTypeNode())}`,
	[SK.IndexedAccessType]: node => `${sig(node.getObjectTypeNode())}[${node.getIndexTypeNode()}]`,
	[SK.FunctionDeclaration]: node=>{
		return `(${node.getParameters().map(p=>sig(p)).join(', ')}) =&gt; ${sig(node.getReturnTypeNode()) || $literal('void')}`;
	},

	//tokens
	[SK.AsteriskToken]: () => '*',
	[SK.AsteriskAsteriskToken]: ()=>'**',
	[SK.AsteriskEqualsToken]: ()=> '*=',
	[SK.AsteriskAsteriskEqualsToken]: ()=>'**=',
	[SK.PlusToken]: ()=> '+',
	[SK.PlusPlusToken]: ()=>'++',
	[SK.PlusEqualsToken]: ()=>'+=',
	[SK.MinusToken]: ()=>'-',
	[SK.MinusMinusToken]: ()=>'--',
	[SK.MinusEqualsToken]: ()=>'-=',
	[SK.SlashToken]: ()=>'/',
	[SK.SlashEqualsToken]: ()=>'/=',
	[SK.LessThanToken]: ()=>'&lt;',
	[SK.LessThanEqualsToken]: ()=>'&lt;=',
	[SK.GreaterThanToken]: ()=>'&gt;',
	[SK.GreaterThanEqualsToken]: ()=>'&gt;='
}

const getOperator = (node: TypeOperatorTypeNode) =>{
	switch(node.getOperator()){
		case SK.ReadonlyKeyword: return 'readonly';
		case SK.KeyOfKeyword: return 'keyof';
		case SK.UniqueKeyword: return 'unique';
	}
}
const Ignores = new Set([
	SK.MultiLineCommentTrivia
])
const defSig = (n: Nodely)=>{
	if(!n || Ignores.has(n.getKind())) return '';
	if(isPrimitive(n)) return $type(n.getText());

	TS.err("Signature Missing type", yellow(n.getKindName()), gray(getFullName(n)), n.getText());
	return "";
}

const sig = (node: Nodely) =>  bySyntax(node, typingMap, defSig);
/**
 * Once a full signature name is resolved the typing of the object will be necessary. This typing however will be different for different declaration type. As such I will be handling these similar to the SyntaxKind... I need a SyntaxKind switching function
 * @param node 
 */
export const getSignature = (node: Nodely) => sig(node);

export const isPrimitiveType = (t: Type) => t.isAny() || t.isBigInt() || t.isNumber() || t.isBoolean() || t.isString() || t.isNever() || t.isUndefined() || t.isUnknown() || t.isNull();

export const fromType = (t: Type) => '';
export const getSignatureFromType = (node: Nodely) => {
	if(!node) return;
	//const t = node.getType();
	//console.log(t.getText(), node.getKindName())
	return '';
}