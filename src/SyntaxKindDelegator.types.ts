import { ArrayTypeNode, ClassDeclaration, Expression, ExpressionWithTypeArguments, FunctionTypeNode, Identifier, InterfaceDeclaration, IntersectionTypeNode, LiteralTypeNode, MethodDeclaration, MethodSignature, NamedTupleMember, Node, NumericLiteral, ParameterDeclaration, ParenthesizedTypeNode, PropertySignature, SyntaxKind as SK, SourceFile, StringLiteral, SyntaxList, TupleTypeNode, TypeAliasDeclaration, TypeLiteralNode, TypeNode, TypeParameterDeclaration, TypeReferenceNode, UnionTypeNode } from "ts-morph";
import { Nodely } from "./types";

/**
 * Each syntax kind we are utilizing has a validation method provided by ts-morph. luckily they all appear to utilize the same syntax
 * These validator along with checking for potential parse errors will coerce the generic Node type to a more accurate type.
 */
export type SyntaxKindValidator<T extends Node> = (node: Nodely) => node is T;

export type SyntaxKindDelegateDefaultAction<T> = (node: Nodely)=>T;

export type SyntaxKindDelegateAction<T extends Node, R> = (node: T, defaultFN: SyntaxKindDelegateDefaultAction<R>) => R
/**
 * For the delegator method to work it needs delegates which will know how to consume the generic Node and utilize it as a specialized node based on its syntax Kind. 
 * 
 */
export interface SyntaxKindDelegate<T extends Node> {
	validate: SyntaxKindValidator<T>
}
export interface SyntaxKindTypeMap {
	[SK.SourceFile]: SourceFile
	[SK.SyntaxList]: SyntaxList
	[SK.TypeAliasDeclaration]: TypeAliasDeclaration,
	[SK.StringKeyword]: Expression,
	[SK.NumberKeyword]: Expression,
	[SK.BooleanKeyword]: Expression,
	[SK.NeverKeyword]: Node,
	[SK.NullKeyword]: Node,
	[SK.UndefinedKeyword]: Expression,
	[SK.AnyKeyword]: Expression
	[SK.LiteralType]: LiteralTypeNode,
	[SK.StringLiteral]: StringLiteral,
	[SK.NumericLiteral]: NumericLiteral,
	[SK.TupleType]: TupleTypeNode,
	[SK.NamedTupleMember]: NamedTupleMember,
	[SK.ArrayType]: ArrayTypeNode,
	[SK.UnionType]: UnionTypeNode,
	[SK.IntersectionType]: IntersectionTypeNode,
	[SK.TypeLiteral]: TypeLiteralNode,
	[SK.PropertySignature]: PropertySignature,
	[SK.MethodSignature]: MethodSignature,
	[SK.TypeReference]: TypeReferenceNode,
	[SK.Identifier]: Identifier,
	[SK.TypeParameter]: TypeParameterDeclaration,
	[SK.Parameter]: ParameterDeclaration,
	[SK.ParenthesizedType]: ParenthesizedTypeNode,
	[SK.FunctionType]: FunctionTypeNode,
	[SK.ClassDeclaration]: ClassDeclaration,
	[SK.ExpressionWithTypeArguments]: ExpressionWithTypeArguments,
	[SK.InterfaceDeclaration]: InterfaceDeclaration,
	[SK.MethodDeclaration]: MethodDeclaration
}

export type TypeByKind<T extends keyof SyntaxKindTypeMap> = SyntaxKindTypeMap[T]
export type SyntaxKindValidatorMap = {
	[k in keyof SyntaxKindTypeMap]: SyntaxKindValidator<SyntaxKindTypeMap[k]>
}

export type SyntaxKindMap<T> = {
	[k in keyof SyntaxKindTypeMap]: SyntaxKindDelegateAction<SyntaxKindTypeMap[k], T>
}

export type SKindMap<T> = Partial<SyntaxKindMap<T>>

export default SK; //this will make it easier to alias in other files later