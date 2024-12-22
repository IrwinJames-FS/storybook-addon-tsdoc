import { ArrayBindingPattern, ArrayLiteralExpression, ArrayTypeNode, ArrowFunction, BinaryExpression, BindingElement, CallExpression, ClassDeclaration, ClassStaticBlockDeclaration, CommentTypeElement, ConditionalTypeNode, Constructor, ConstructorDeclaration, ConstructorTypeNode, ExportDeclaration, Expression, ExpressionWithTypeArguments, FunctionDeclaration, FunctionExpression, FunctionTypeNode, GetAccessorDeclaration, Identifier, IndexedAccessTypeNode, InterfaceDeclaration, IntersectionTypeNode, LiteralTypeNode, MethodDeclaration, MethodSignature, NamedTupleMember, Node, NumericLiteral, ObjectBindingPattern, ObjectLiteralExpression, ParameterDeclaration, ParenthesizedTypeNode, PropertyAccessExpression, PropertyDeclaration, PropertySignature, QualifiedName, RestTypeNode, SetAccessorDeclaration, SyntaxKind as SK, SourceFile, StringLiteral, SyntaxList, TupleTypeNode, TypeAliasDeclaration, TypeLiteralNode, TypeNode, TypeOperatorTypeNode, TypeParameterDeclaration, TypePredicateNode, TypeReferenceNode, UnionTypeNode, VariableDeclaration, VariableStatement } from "ts-morph";
import { Nodely } from "./types";
import { IndexedAccessType } from "typescript";

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
export interface SyntaxKindTypeMap<T=never> {
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
	[SK.MethodDeclaration]: MethodDeclaration,
	[SK.PropertyDeclaration]: PropertyDeclaration,
	[SK.Constructor]: ConstructorDeclaration,
	[SK.ArrayLiteralExpression]: ArrayLiteralExpression,
	[SK.ClassStaticBlockDeclaration]: ClassStaticBlockDeclaration,
	[SK.GetAccessor]: GetAccessorDeclaration,
	[SK.SetAccessor]: SetAccessorDeclaration,
	[SK.ConditionalType]: ConditionalTypeNode,
	[SK.VariableStatement]: VariableStatement,
	[SK.VariableDeclaration]: VariableDeclaration,
	[SK.FunctionExpression]: FunctionExpression,
	[SK.ArrowFunction]: ArrowFunction,
	[SK.ObjectLiteralExpression]: ObjectLiteralExpression,
	[SK.ObjectBindingPattern]: ObjectBindingPattern
	[SK.BindingElement]: BindingElement,
	[SK.ArrayBindingPattern]: ArrayBindingPattern
	[SK.ExportDeclaration]: ExportDeclaration,
	[SK.QualifiedName]: QualifiedName,
	[SK.TypePredicate]: TypePredicateNode,
	[SK.MultiLineCommentTrivia]: Node,
	[SK.TypeOperator]: TypeOperatorTypeNode,
	[SK.BinaryExpression]: BinaryExpression,
	[SK.PropertyAccessExpression]: PropertyAccessExpression,
	[SK.AsteriskToken]: Node,
	[SK.AsteriskAsteriskEqualsToken]: Node,
	[SK.AsteriskEqualsToken]: Node,
	[SK.AsteriskAsteriskToken]: Node,
	[SK.PlusToken]: Node,
	[SK.PlusPlusToken]: Node,
	[SK.PlusEqualsToken]: Node,
	[SK.MinusToken]: Node,
	[SK.MinusMinusToken]: Node,
	[SK.MinusEqualsToken]: Node,
	[SK.SlashToken]: Node,
	[SK.SlashEqualsToken]: Node,
	[SK.LessThanToken]: Node,
	[SK.LessThanEqualsToken]: Node,
	[SK.GreaterThanEqualsToken]: Node,
	[SK.GreaterThanToken]: Node,
	[SK.CallExpression]: CallExpression,
	[SK.RestType]: RestTypeNode,
	[SK.IndexedAccessType]: IndexedAccessTypeNode,
	[SK.FunctionDeclaration]: FunctionDeclaration
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