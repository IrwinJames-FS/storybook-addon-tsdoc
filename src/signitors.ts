/*
I just need to split up the logic into more consumable chunks for myself. 

This file will be responsible for providing resusable methods to parse common declaration types
*/

import { ArrayBindingPattern, ArrayLiteralExpression, ArrowFunction, ClassDeclaration, ClassExpression, EnumMember, Expression, ExpressionableNode, ExtendsClauseableNode, FunctionDeclaration, FunctionExpression, FunctionTypeNode, GetAccessorDeclaration, Identifier, InterfaceDeclaration, IntersectionTypeNode, LiteralTypeNode, MethodDeclaration, MethodSignature, NamedNode, NamedTupleMember, NewExpression, Node, ParameterDeclaration, PropertyAccessExpression, PropertyAssignment, PropertyDeclaration, PropertySignature, ReturnTypedNode, TupleTypeNode, Type, TypeAliasDeclaration, TypeOperatorTypeNode, TypeParameter, TypeParameterDeclaration, TypeReferenceNode, UnionTypeNode, VariableDeclaration } from "ts-morph";
import { typelit } from "./constants";
import { $href, $kd, $link, $literal, $name, $type } from "./decorators";
import { sig } from "./node-signature";
import { getDocPath, getFullName, getTypeNode, isAsync } from "./node-tools";
import SK from "./SyntaxKindDelegator.types";
import { Nodely } from "./types";
import { escape } from "./utils";

type Mod<N extends Node> = (node: N) => string
const modHandler = <N extends Node>(node: N, ...mods: (Mod<N> | string)[]):string => {
	return mods.reduce((o,v)=>o+(typeof v === 'string' ? v:v(node)) as string, '') as string;
}

/**
 * Primitive types are simply converted to a string
 * @param t 
 * @returns 
 */
const isPrimitiveType = (t: Type) => t.isAny() || t.isBigInt() || t.isNever() || t.isNull() || t.isNumber() || t.isString() || t.isBoolean() || t.isUndefined();

/**
 * Primitive literals are also converted to a string but wrapped in a different wrapper and escaped as they may contain illegal jsx characters.
 * @param t 
 * @returns 
 */
const isPrimitiveLiteral = (t: Type) => t.isBigIntLiteral() || t.isNumberLiteral() || t.isStringLiteral() || t.isTemplateLiteral() || t.isBooleanLiteral();


/**
 * Diving down to the underlying type provides lower level access to the typing however ts-morph provides a wonderul interface via their Node class. Since it completely crawls the Source File it seems more suitable to get the dclaration that is being referenced 
 * @param t 
 * @returns 
 */
export const fromType = (t: Type | undefined):string => {
	if(!t) return '';
	if(isPrimitiveType(t)) return $type(t.getText());
	if(isPrimitiveLiteral(t)) return $literal(escape(t.getText()));

	const args = t.getTypeArguments().map(fromType).filter(n=>!!n).join(', ').wrap('<', '>');
	const symbol = t.getSymbol() ?? t.getAliasSymbol();
	const [dec] = symbol?.getDeclarations() ?? [];
	if(dec) {
		return (Node.isExpression(dec) ? (Node.isNewExpression(dec) ? $kd`new`:'') + $link(dec.getParent()!):$link(dec))+args;
	}
	return t.isUnion() ? t.getUnionTypes().map(fromType).join(' | ')
	: t.isArray() ? fromType(t.getArrayElementType()) + '[]'
	: t.isIntersection() ? t.getIntersectionTypes().map(fromType).join(' & ')
	: t.isTuple() ? t.getTupleElements().map(fromType).join(', ').wrap('[',']')
	: '';
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

/**
 * This mod handler simply attempts to parse the name node. This should ultimately end with an identifier but also allow for potential destructured objects to be traversed without change of logic.
 * @param node 
 * @returns 
 */
export const fromName = (node: Node) => Node.hasName(node) ? sig(node.getNameNode()):'';

export const getExpression = (node: ExpressionableNode | NewExpression) => sig(node.getExpression());
/**
 * With typenodes not alway being provided this method acts as a point where I can change the logic if getting a typenode fails.
 * @param node 
 * @returns 
 */
export const fromTypeNode = (node: Node): string => {
	const tn = getTypeNode(node);
	return tn ? sig(tn)
	: getSignatureFromType(node) ?? ''
}

/**
 * Returns can be explicit or inferred.
 * 
 * Similar to a typenode on how its handled.
 * @todo - prior to checking the type check the jsdocs for a returns or return tag
 * @todo - traverse the body and collect return expressions manually (this is purely to allow differenciation between class instances and class constructors being returned in the expression.)
 * @param node 
 * @returns 
 */
export const fromReturn = (node: ReturnTypedNode) => {
	
	const tn = node.getReturnTypeNode();
	const s =  tn ? sig(tn)
	: fromType(node.getReturnType())
	return s || $literal('void');
}

/**
 * A convenience method to signature and wrap a statement
 * @param nodes 
 * @param pre 
 * @param post 
 * @returns 
 */
export const genTypes = (nodes: Node[], pre: string ='<', post: string = '>') => nodes.map(sig).join(', ').wrap(pre, post);

/**
 * Checks if a node is a generator. This is made generic as Arrow functions cant be generators but aside from that can do just about anything else a function can so it does not make sense to have two separate signators.
 * @param node 
 * @returns 
 */
export const isGenerator = (node: Node) => !('isGenerator' in node) || typeof node.isGenerator !== 'function' ? false:node.isGenerator();

/**
 * Returns a literal representation of {...}
 * @returns 
 */
export const objLiteral = () => $literal(typelit);

/**
 * Converts modifier tokens to plain text
 * @todo style this maybe.
 * @param node 
 * @returns 
 */
export const getModifiers = (node: Node) => {
	if(!Node.isModifierable(node)) return '';
	return node.getModifiers().map(m=>m.getText()).join(' ').wrap('', ' ');
}

/**
 * document a contraint
 * @param node 
 * @returns 
 */
export const getConstraint = (node: TypeParameterDeclaration) => sig(node.getConstraint()).wrap( ' extends ', '');

export const getImplements = (node: ClassDeclaration | ClassExpression) => node.getImplements().map(sig).join(', ').wrap(' implements ', '')

export const getExtend = (node:ClassDeclaration | ClassExpression) => sig(node.getExtends()).wrap(' extends ', '');

export const getExtends = (node:ExtendsClauseableNode) => node.getExtends().map(sig).join(', ').wrap(' extends ', '');
/**
 * Returns the appropriate operator based on syntax kind. 
 * 
 * could probably just use getText. 
 * @param node 
 * @returns 
 */
export const getOperator = (node: TypeOperatorTypeNode) =>{
	switch(node.getOperator()){
		case SK.ReadonlyKeyword: return 'readonly';
		case SK.KeyOfKeyword: return 'keyof';
		case SK.UniqueKeyword: return 'unique';
	}
}

/**
 * Checks if value has a question token and if so passes it to the signature.
 * @param node 
 * @returns 
 */
export const opt = (node: Node) => (Node.isQuestionTokenable(node) && node.hasQuestionToken()) ? '?':'';

/**
 * Checks if a spread symbol precedes the node and if so passes it to the signature. 
 * @param node 
 * @returns 
 */
export const spread = (node: Node) => (Node.isDotDotDotTokenable(node) && node.getDotDotDotToken()) ? '...':'';

/**
 * documents a potential async modifier 
 * @param node 
 * @returns 
 */
export const getAsync = (node: Node) => isAsync(node) ? 'async ':''

/**
 * documents a potential generator modifier.
 * @param node 
 * @returns 
 */
export const getGenerator = (node: Node) => isGenerator(node) ? '*':'';

/**
 * documents type parameters.
 * @param node 
 * @returns 
 */
export const getTypeParameters = (node: Node) => genTypes(Node.isTypeParametered(node) ? node.getTypeParameters():[])

export const getTypeArguments = (node: Node) => genTypes(Node.isTypeArgumented(node) ? node.getTypeArguments():[])

/**
 * Documents a functions arguments (aka: parameters).
 * @param node 
 * @returns 
 */
export const getArguments = (node: Node) => `(${(Node.isParametered(node) ? node.getParameters().map(sig):[]).join(', ')})`;

/**
 * These two declaration types share a common signature. no point in repeating myself.
 * Document a proprty type declaration. 
 * @param node 
 * @returns 
 */
export const propertyDecSig = (node: PropertyDeclaration | PropertySignature | PropertyAssignment) => modHandler(node,
	getModifiers, spread, fromTypeNode, opt);

/**
 * Document a function type declaration. 
 * @param node 
 * @returns 
 */
export const fnSignature = (node: FunctionDeclaration | FunctionExpression | MethodDeclaration | FunctionTypeNode | MethodSignature | ArrowFunction) => modHandler(node, 
getAsync, getTypeParameters, getArguments, getGenerator, ' =&gt; ', fromReturn);

/**
 * document a named tuple member.
 * @param node 
 * @returns 
 */
export const namedTupleMember = (node: NamedTupleMember) => modHandler(node, 
	spread, fromName, opt,': ', fromTypeNode);

/**
 * document a property access expression.
 * @param node 
 * @returns 
 */
export const propertyAccessExpression = (node: PropertyAccessExpression) => modHandler(node, sig(node.getExpression()), opt);

/**
 * Get the type alias declaration
 * @param node 
 * @returns 
 */
export const typeAliasDeclaration = (node: TypeAliasDeclaration) => fromTypeNode(node);

/**
 * Document a union type.
 * @param node 
 * @returns 
 */
export const unionType = (node: UnionTypeNode) => node.getTypeNodes().map(sig).join(' | ');

/**
 * Document an intersection type.
 * @param node 
 * @returns 
 */
export const intersectionType = (node: IntersectionTypeNode) => node.getTypeNodes().map(sig).join(' & ');

/**
 * document a literal type
 * @param node 
 * @returns 
 */
export const literalType = (node: LiteralTypeNode) => $literal(escape(node.getText()));

/**
 * document an array literal
 * @param node 
 * @returns 
 */
export const arrayLiteral = (node: ArrayLiteralExpression | TupleTypeNode | ArrayBindingPattern) => node.getElements().map(sig).join(', ').wrap('[',']');

/**
 * document a type reference. funny thing the type reference doesnt create a link. 
 * @param node 
 * @returns 
 */
export const typeReference = (node: TypeReferenceNode) => {
	const typeName = node.getTypeName();
	
	const args = node.getTypeArguments();
	if(typeName.getText() === "Array") return sig(args[0])+"[]";
	return sig(typeName) + args.map(sig).join(', ').wrap('<', '>')
}

/**
 * An identifier is a sort of reference that points to a definition. if theres a definition and the definition doesnt point back to said node then it becomes a link. 
 * @todo test this with destructured nodes. 
 * @param node 
 * @returns 
 */
export const identifier = (node: Identifier) => {
	const def = node.getDefinitionNodes()[0];
	if(!def || getFullName(def) === getFullName(node)) return $type(node.getText());
	const href = getDocPath(def);
	return href ? $href(node.getText(), href):$type(node.getText());
}

/**
 * A type parameter 
 * @param node 
 * @returns 
 */
export const typeParameter = (node: TypeParameterDeclaration) => modHandler(node, getModifiers, fromName, getConstraint);

/**
 * A parameter is a little different then a normal expression in typescript with a parameter typing should be expected or default to any and the initializer should not be used when a typeNode is not present. Also the typ should not be used for this same reason.
 * @param node 
 */
export const parameter = (node: ParameterDeclaration) => {
	const typeNode = sig(node.getTypeNode()) || $type("any");
	const initializer = sig(node.getInitializer());
	return `${node.isRestParameter() ? $name('...'):''}${sig(node.getNameNode())}: ${typeNode}${initializer.wrap(' = ', '')}`;
}

/**
 * A class declaration and class express differ at one point and thats the name. 
 * @param node 
 * @returns 
 */
export const classDeclaration = (node: ClassDeclaration | ClassExpression) => modHandler(node, Node.isClassExpression(node) ? $kd`class`:'', getTypeParameters, getExtend, getImplements);

export const interfaceDeclaration = (node: InterfaceDeclaration) => modHandler(node, getTypeParameters, getExtends);

export const getAccessor = (node: GetAccessorDeclaration) => modHandler(node, getModifiers, fromReturn);

export const variableDeclaration = (node: VariableDeclaration) =>  fromTypeNode(node)

export const newExpression = (node: NewExpression) => modHandler(node, $kd`new `, getExpression, getTypeArguments,);

export const literal = (node: Node) => $literal(escape(node.getText()));

export const enummember = (node: EnumMember) => sig(node.getInitializer()).wrap(': ', '');