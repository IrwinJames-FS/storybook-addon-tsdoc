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

import { getDocPath, getFullName, getName, getTypeNode, isPrimitive } from "./node-tools";
import { ArrowFunction, ClassDeclaration, ClassExpression, FunctionDeclaration, FunctionExpression, FunctionTypeNode, MethodDeclaration, MethodSignature, ModifierableNode, Node, PropertyDeclaration, PropertySignature, Symbol, Type, TypeOperatorTypeNode } from "ts-morph";
import { bySyntax } from "./SyntaxKindDelegator";
import SK, { SKindMap } from "./SyntaxKindDelegator.types";
import { $href, $kd, $kind, $link, $literal, $name, $t, $type } from "./decorators";
import { gray, yellow } from "console-log-colors";
import { Nodely } from "./types";
import TS from "./TS";
import { typelit } from "./constants";
import { escape } from "./utils";

/**
 * With typenodes not alway being provided this method acts as a point where I can change the logic if getting a typenode fails.
 * @param node 
 * @returns 
 */
const fromTypeNode = (node: Node): string => {
	const tn = getTypeNode(node);
	return tn ? sig(tn)
	: getSignatureFromType(node) ?? ''
}

const objLiteral = () => $literal(typelit);

const genTypes = (nodes: Node[], pre: string ='<', post: string = '>') => nodes.map(sig).join(', ').wrap(pre, post);

const isAsync = (node: Node) => {
	if(!('isAsync' in node) || typeof node.isAsync !== 'function') return false;
	return node.isAsync();
}
const isGenerator = (node: Node) => {
	if(!('isGenerator' in node) || typeof node.isGenerator !== 'function') return false;
	return node.isGenerator();
}
/**
 * These two declaration types share a common signature. no point in repeating myself. 
 * @param node 
 * @returns 
 */
const propertyDecSig = (node: PropertyDeclaration | PropertySignature) => `${node.getModifiers().join(', ').wrap('', ' ')}${sig(node.getNameNode())}${node.hasQuestionToken() ? '?':''}: ${fromTypeNode(node)}`;

const fnSignature = (node: FunctionDeclaration | FunctionExpression | MethodDeclaration | FunctionTypeNode | MethodSignature | ArrowFunction) => `${isAsync(node) ? 'async ':''}${isGenerator(node) ? '*':''}${genTypes(node.getTypeParameters())}(${genTypes(node.getParameters(), '', '')}) =&gt; ${sig(node.getReturnTypeNode()) || fromType(node.getReturnType()) || $literal('void')}`;

const typingMap: SKindMap<string> = {
	//functional declarations
	[SK.FunctionDeclaration]: fnSignature,
	[SK.FunctionExpression]: fnSignature,
	[SK.MethodDeclaration]: fnSignature,
	[SK.FunctionType]: fnSignature,
	[SK.MethodSignature]: fnSignature,
	[SK.ArrowFunction]: fnSignature,
	[SK.PropertySignature]: propertyDecSig,
	[SK.PropertyDeclaration]: propertyDecSig,
	[SK.PropertyAssignment]: node => `${sig(node.getNameNode())}${node.hasQuestionToken() ? '?':''}: ${fromTypeNode(node)}`,
	[SK.NamedTupleMember]: node=>`${node.getDotDotDotToken() ? '...':''}${sig(node.getNameNode())}${node.hasQuestionToken() ? '?':''}: ${fromTypeNode(node)}`,
	[SK.BindingElement]: fromTypeNode,
	[SK.PropertyAccessExpression]: node => `${sig(node.getNameNode())}`,
	[SK.UnionType]: node=>node.getTypeNodes().map(sig).join(' | '),
	[SK.LiteralType]: node=>$literal(node.getText()),
	[SK.IntersectionType]: node=>node.getTypeNodes().map(sig).join(' & '),
	[SK.ArrayType]: node=>`${sig(node.getElementTypeNode())}[]`,
	[SK.ArrayLiteralExpression]: node=>`[${node.getElements().map(sig)}]`,
	[SK.TupleType]: node=> genTypes(node.getElements(), '[',']'),
	[SK.ParenthesizedType]: node=>`(${fromTypeNode(node)})`,
	[SK.Constructor]: node=>`${$type("new")} (${node.getParameters().map(p=>sig(p)).join(', ')})=>${$type(getName(node.getParent()))}`,
	[SK.SetAccessor]: node=> node.getParameters().map(p=>sig(p)).join(', '),
	[SK.ConditionalType]: node => `${sig(node.getCheckType())} extends ${sig(node.getExtendsType())} ? ${sig(node.getTrueType())}<br/>: ${sig(node.getFalseType())}`,
	[SK.ExpressionWithTypeArguments]: node => `${sig(node.getExpression())}${node.getTypeArguments().map(a=>sig(a)).join(', ').wrap('<','>')}`,
	[SK.RestType]: node => `...${fromTypeNode(node)}`,
	[SK.ArrayBindingPattern]: node => genTypes(node.getElements(), '[',']'),
	[SK.QualifiedName]: node => `${sig(node.getLeft())}.${sig(node.getRight())}`,
	[SK.TypePredicate]: node => `${sig(node.getParameterNameNode())} ${node.hasAssertsModifier() ? sig(node.getAssertsModifier()):'is'} ${sig(node.getTypeNode())}`,
	[SK.TypeOperator]: node => `${$kind(getOperator(node))} ${fromTypeNode(node)}`,
	[SK.BinaryExpression]: node => `${sig(node.getLeft())} ${sig(node.getOperatorToken())} ${sig(node.getRight())}`,
	[SK.CallExpression]: node => $type(escape(node.getReturnType().getText())),
	[SK.IndexedAccessType]: node => `${sig(node.getObjectTypeNode())}[${node.getIndexTypeNode()}]`,

	//object literat expressions or declarations or types
	[SK.ObjectLiteralExpression]: objLiteral,
	[SK.ObjectBindingPattern]: objLiteral,
	[SK.TypeLiteral]: objLiteral,
	
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
	[SK.GreaterThanEqualsToken]: ()=>'&gt;=',
	[SK.TypeAliasDeclaration]: (node)=>{
		return `${node.getName()}${genTypes(node.getTypeParameters())}: ${fromTypeNode(node)}`;
	},
	[SK.TypeReference]: node=>{ 
		const typeName = node.getTypeName();
		const args = node.getTypeArguments();
		//corner cases
		if(typeName.getText() === "Array"){
			return sig(args[0])+"[]";
		}
		return sig(typeName) + args.map(sig).join(', ').wrap('<', '>')
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
		const modifiers = node.getModifiers()
		return `${modifiers.map(sig).join(' ')}${modifiers.length ? ' ':''}${$name(node.getName())}${(extension ? ' extends ' + sig(extension):'')}`;
	},
	[SK.Parameter]: node=>{
		const typeNode = fromTypeNode(node);
		const initializer = sig(node.getInitializer());
		return `${$name((node.isRestParameter() ? '...':'')+sig(node.getNameNode()))}: ${typeNode}${initializer ? ' = '+initializer:''}`;
	},
	[SK.ClassDeclaration]: node=>{
		const extensions = sig(node.getExtends());
		const implementions = node.getImplements().map(i=>sig(i)).join(', ');
		return `${extensions ? ' extends '+ extensions:''}${implementions ? ' implements ' + implementions:''}`
	},
	[SK.ClassExpression]: node=>{
		const extensions = node.getExtends();
		const implementations = node.getImplements();
		return `${$kd`class`}${extensions ? (' extends ' + sig(extensions)):''}${implementations.map(n=>` implements ${sig(n)}`)}${typelit}`;
	},
	[SK.InterfaceDeclaration]: node=>{
		const extensions = node.getExtends();
		return `${extensions.map(node => `extends ${sig(node)}`).join(' ')}`;
	},
	[SK.GetAccessor]: node=> {
		const rtn = node.getReturnTypeNode();
		console.log("This is happening", node.getReturnType().getText());
		return rtn ? sig(rtn)
		: fromType(node.getReturnType())
	},
	[SK.VariableDeclaration]: node => {
		const tn = fromTypeNode(node);
		return tn ?? '';
	},
	[SK.NewExpression]: node => `${sig(node.getExpression())}${genTypes(node.getTypeArguments())}`,
	[SK.ObjectKeyword]: node => `&lcub;&rcub;`,
	[SK.StringLiteral]: node => $literal(escape(node.getText())),
	[SK.NumericLiteral]: node=> $literal(node.getText()),
	[SK.BigIntLiteral]: node=>$literal(node.getText()),
	[SK.TrueKeyword]: node=>$literal(node.getText()),
	[SK.FalseKeyword]: node=>$literal(node.getText())
}

/**
 * Converts modifier tokens to plain text
 * @todo style this maybe.
 * @param node 
 * @returns 
 */
export const getModifiers = (node: Node) => {
	if(!Node.isModifierable(node)) return [];
	return node.getModifiers().map(m=>m.getText()).join(' ')
}

/**
 * Returns the appropriate operator based on syntax kind. 
 * 
 * could probably just use getText. 
 * @param node 
 * @returns 
 */
const getOperator = (node: TypeOperatorTypeNode) =>{
	switch(node.getOperator()){
		case SK.ReadonlyKeyword: return 'readonly';
		case SK.KeyOfKeyword: return 'keyof';
		case SK.UniqueKeyword: return 'unique';
	}
}

/**
 * A list of types to be ignored... perhaps I should build this into bySyntax
 */
const Ignores = new Set([
	SK.MultiLineCommentTrivia
]);

/**
 * A default action 
 * @param n 
 * @returns 
 */
const defSig = (n: Nodely)=>{
	if(!n || Ignores.has(n.getKind())) return '';
	if(isPrimitive(n)) return $type(n.getText());

	TS.err("Signature Missing type", yellow(n.getKindName()), gray(getFullName(n)), n.getText());
	return "";
}

/**
 * Just a convenience method to make the same bySyntax method reusable. 
 * @param node 
 * @returns 
 */
const sig = (node: Nodely) =>  bySyntax(node, typingMap, defSig);
/**
 * Once a full signature name is resolved the typing of the object will be necessary. This typing however will be different for different declaration type. As such I will be handling these similar to the SyntaxKind... I need a SyntaxKind switching function
 * @param node 
 */
export const getSignature = (node: Nodely) => {
	return sig(node);
}

const isPrimitiveType = (t: Type) => t.isAny() || t.isBigInt() || t.isNever() || t.isNull() || t.isNumber() || t.isString() || t.isBoolean();

const isPrimitiveLiteral = (t: Type) => t.isBigIntLiteral() || t.isNumberLiteral() || t.isStringLiteral() || t.isTemplateLiteral();

/**
 * A utility method allowing me to add in a method to log information when an area that lacks support is encountered. 
 * @param log 
 * @param retVal 
 * @returns 
 */
const logRet = <T>(log: ()=>void, retVal: T): T => {
	log();
	return retVal;
}

/**
 * This is a method to catch a link before is object generalizes it
 * @param t 
 */
const fromTypeRef = (t: Type) => {
	const symbol = t.getSymbol()
	const [dec] = symbol?.getDeclarations() ?? [];
	
	if(!dec) return '';
	//symbols have access to the closest doc tags... this may be a good place to refer to said tags when building out tag support.
	const args = t.getTypeArguments().map(fromType).filter(n=>!!n).join(', ').wrap('<', '>');
	
	return $link(dec) + args;
}
const logTypeInfo = (t: Type) => {
	console.log(t.getText(), `
isAny: ${t.isAny()}
isAnonymous: ${t.isAnonymous()}
isArray: ${t.isArray()}
isBigInt: ${t.isBigInt()}
isBigIntLiteral: ${t.isBigIntLiteral()}
isBoolean: ${t.isBoolean()}
isClass: ${t.isClass()}
isClassOrInterface: ${t.isClassOrInterface()}
isEnum: ${t.isEnum()}
isEnumLiteral: ${t.isEnumLiteral()}
isInterface: ${t.isInterface()}
isIntersection: ${t.isIntersection()}
isLiteral: ${t.isLiteral()}
isNever: ${t.isNever()}
isNull: ${t.isNull()}
isNullable: ${t.isNullable()}
isNumber: ${t.isNumber()}
isNumberLiteral: ${t.isNumberLiteral()}
isObject:${t.isObject()}
isReadOnlyArray: ${t.isReadonlyArray()}
isString: ${t.isString()}
isStringLiteral: ${t.isStringLiteral()}
isTemplateLiteral: ${t.isTemplateLiteral()}
isTuple: ${t.isTuple()}
isTypeParameter:${t.isTypeParameter()}
isUndefined:${t.isUndefined()}
isUnion: ${t.isUnion()}
isUnionOrIntersection: ${t.isUnionOrIntersection()}
isUnknown:${t.isUnknown()}
isVoid:${t.isVoid()}`)
}
/**
 * Diving down to the underlying type provides lower level access to the typing however ts-morph provides a wonderul interface via their Node class. Since it completely crawls the Source File it seems more suitable to get the dclaration that is being referenced 
 * @param t 
 * @returns 
 */
export const fromType = (t: Type | undefined):string => {
	if(!t) return '';
	//logTypeInfo(t);
	return isPrimitiveType(t) ? $type(t.getText())
	: isPrimitiveLiteral(t) ? $literal(escape(t.getText()))
	: t.isArray() ? fromType(t.getArrayElementType()).wrap('', '[]')
	: t.isObject() ? t.isAnonymous() ? $literal(typelit):fromTypeRef(t)
	: logRet(()=>{
		console.log("Type parsing missing support", t.getText(), t.isObject(), t.isLiteral());
	}, '');
}

export const fromSymbol = (symbol?: Symbol) => {
	return '';
}
/**
 * Attempts to get a type node from the types declaration.
 * @param node 
 * @returns 
 */
export const getSignatureFromType = (node: Nodely) => {
	if(!node) return '';
	const t = node.getType();
	const tp = fromType(t)
	return tp;
}