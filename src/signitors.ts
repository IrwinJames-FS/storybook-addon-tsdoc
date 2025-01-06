/*
I just need to split up the logic into more consumable chunks for myself. 

This file will be responsible for providing resusable methods to parse common declaration types
*/

import { ArrayBindingPattern, ArrayLiteralExpression, ArrowFunction, ClassDeclaration, ClassExpression, EnumMember, FunctionDeclaration, FunctionExpression, FunctionTypeNode, GetAccessorDeclaration, Identifier, InterfaceDeclaration, IntersectionTypeNode, LiteralTypeNode, MethodDeclaration, MethodSignature, NamedNode, NamedTupleMember, NewExpression, Node, ParameterDeclaration, PropertyAccessExpression, PropertyAssignment, PropertyDeclaration, PropertySignature, ReturnTypedNode, TupleTypeNode, Type, TypeAliasDeclaration, TypeOperatorTypeNode, TypeParameter, TypeParameterDeclaration, TypeReferenceNode, UnionTypeNode, VariableDeclaration } from "ts-morph";
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

const isPrimitiveType = (t: Type) => t.isAny() || t.isBigInt() || t.isNever() || t.isNull() || t.isNumber() || t.isString() || t.isBoolean() || t.isUndefined();

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

export const fromName = (node: Node) => Node.hasName(node) ? sig(node.getNameNode()):'';
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

export const fromReturn = (node: ReturnTypedNode) => {
	
	const tn = node.getReturnTypeNode();
	const s =  tn ? sig(tn)
	: fromType(node.getReturnType())
	return s || $literal('void');
}

export const genTypes = (nodes: Node[], pre: string ='<', post: string = '>') => nodes.map(sig).join(', ').wrap(pre, post);

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

export const opt = (node: Node) => (Node.isQuestionTokenable(node) && node.hasQuestionToken()) ? '?':'';
export const spread = (node: Node) => (Node.isDotDotDotTokenable(node) && node.getDotDotDotToken()) ? '...':'';
export const getAsync = (node: Node) => isAsync(node) ? 'async ':''
export const getGenerator = (node: Node) => isGenerator(node) ? '*':'';
export const getTypeParameters = (node: Node) => genTypes(Node.isTypeParametered(node) ? node.getTypeParameters():[])
export const getArguments = (node: Node) => `(${Node.isParametered(node) ? node.getParameters().map(sig):[]})`;
/**
 * These two declaration types share a common signature. no point in repeating myself. 
 * @param node 
 * @returns 
 */
export const propertyDecSig = (node: PropertyDeclaration | PropertySignature | PropertyAssignment) => modHandler(node, getModifiers, spread, fromName, opt,': ', fromTypeNode);
export const fnSignature = (node: FunctionDeclaration | FunctionExpression | MethodDeclaration | FunctionTypeNode | MethodSignature | ArrowFunction) => modHandler(node, getAsync, getGenerator, getTypeParameters,fromName(node),getArguments, ' =&gt; ', fromReturn);
export const namedTupleMember = (node: NamedTupleMember) => modHandler(node, spread, fromName, opt,': ', fromTypeNode);
export const propertyAccessExpression = (node: PropertyAccessExpression) => modHandler(node, fromName, opt);
export const unionType = (node: UnionTypeNode) => node.getTypeNodes().map(sig).join(' | ');
export const intersectionType = (node: IntersectionTypeNode) => node.getTypeNodes().map(sig).join(' & ');
export const literalType = (node: LiteralTypeNode) => $literal(node.getText());
export const arrayLiteral = (node: ArrayLiteralExpression | TupleTypeNode | ArrayBindingPattern) => node.getElements().map(sig).join(', ').wrap('[',']');
export const typeAliasDeclaration = (node: TypeAliasDeclaration) => modHandler(node, fromName, getTypeParameters, ': ', fromTypeNode);
export const typeReference = (node: TypeReferenceNode) => {
	const typeName = node.getTypeName();
	
	const args = node.getTypeArguments();
	if(typeName.getText() === "Array") return sig(args[0])+"[]";
	return sig(typeName) + args.map(sig).join(', ').wrap('<', '>')
}
export const identifier = (node: Identifier) => {
	const def = node.getDefinitionNodes()[0];
	if(!def || getFullName(def) === getFullName(node)) return $type(node.getText());
	const href = getDocPath(def);
	return href ? $href(node.getText(), href):$type(node.getText());
}
export const typeParameter = (node: TypeParameterDeclaration) => {
	const extension = node.getConstraint();
	const modifiers = node.getModifiers();
	return `${modifiers.map(sig).join(' ').wrap('', ' ')}${sig(node.getNameNode())}${extension ? ' extends ' + sig(extension):''}`;
}

/**
 * A parameter is a little different then a normal expression in typescript with a parameter typing should be expected or default to any and the initializer should not be used when a typeNode is not present. Also the typ should not be used for this same reason.
 * @param node 
 */
export const parameter = (node: ParameterDeclaration) => {
	const typeNode = sig(node.getTypeNode()) || $type("any");
	const initializer = sig(node.getInitializer());
	return `${node.isRestParameter() ? $name('...'):''}${sig(node.getNameNode())}: ${typeNode}${initializer.wrap(' = ', '')}`;
}

export const classDeclaration = (node: ClassDeclaration | ClassExpression) => `${Node.isClassDeclaration(node) ? fromName(node):''}${node.getTypeParameters().map(sig).join(', ').wrap('<','>')}${sig(node.getExtends()).wrap(' extends ', '')}${node.getImplements().map(sig).join(', ').wrap(' implements ', '')}`;

export const interfaceDeclaration = (node: InterfaceDeclaration) => fromName(node) + node.getTypeParameters().map(sig).join(', ').wrap('<','>') + node.getExtends().map(sig).join(', ').wrap(' extends ', '');

export const getAccessor = (node: GetAccessorDeclaration) => `${getModifiers(node)}${fromName(node)}: ${fromReturn(node)}`;

export const variableDeclaration = (node: VariableDeclaration) => modHandler(node, fromName,': ', fromTypeNode);

export const newExpression = (node: NewExpression) => `${sig(node.getExpression())}${genTypes(node.getTypeArguments())}`;

export const literal = (node: Node) => $literal(escape(node.getText()));

export const enummember = (node: EnumMember) => fromName(node)+sig(node.getInitializer()).wrap(': ', '');