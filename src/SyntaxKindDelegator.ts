import { SyntaxKindDelegateAction, SyntaxKindMap, SyntaxKindTypeMap, SyntaxKindValidator, SyntaxKindValidatorMap, TypeByKind } from "./SyntaxKindDelegator.types";
import { Node, SyntaxKind as SK } from "ts-morph";
import { Nodely } from "./types";
import TS from "./TS";

export const isNode = (node: Nodely): node is Node => {
	if(!node) return false;
	return true;
}
export const SyntaxKindDelegator: SyntaxKindValidatorMap = {
	[SK.SourceFile]: Node.isSourceFile,
	[SK.SyntaxList]: Node.isSyntaxList,
	[SK.TypeAliasDeclaration]: Node.isTypeAliasDeclaration,
	[SK.StringKeyword]: Node.isStringKeyword,
	[SK.NumberKeyword]: Node.isNumberKeyword,
	[SK.BooleanKeyword]: Node.isBooleanKeyword,
	[SK.NeverKeyword]: Node.isNeverKeyword,
	[SK.NullKeyword]: isNode,
	[SK.UndefinedKeyword]: Node.isUndefinedKeyword,
	[SK.AnyKeyword]: Node.isAnyKeyword,
	[SK.LiteralType]: Node.isLiteralTypeNode,
	[SK.StringLiteral]: Node.isStringLiteral,
	[SK.NumericLiteral]: Node.isNumericLiteral,
	[SK.TupleType]: Node.isTupleTypeNode,
	[SK.NamedTupleMember]: Node.isNamedTupleMember,
	[SK.ArrayType]: Node.isArrayTypeNode,
	[SK.UnionType]: Node.isUnionTypeNode,
	[SK.IntersectionType]: Node.isIntersectionTypeNode,
	[SK.TypeLiteral]: Node.isTypeLiteral,
	[SK.PropertySignature]: Node.isPropertySignature,
	[SK.MethodSignature]: Node.isMethodSignature,
	[SK.TypeReference]:Node.isTypeReference,
	[SK.Identifier]: Node.isIdentifier,
	[SK.TypeParameter]: Node.isTypeParameterDeclaration,
	[SK.Parameter]: Node.isParameterDeclaration,
	[SK.FunctionType]: Node.isFunctionTypeNode,
	[SK.ParenthesizedType]: Node.isParenthesizedTypeNode,
	[SK.ClassDeclaration]: Node.isClassDeclaration,
	[SK.ExpressionWithTypeArguments]: Node.isExpressionWithTypeArguments,
	[SK.InterfaceDeclaration]: Node.isInterfaceDeclaration,
	[SK.MethodDeclaration]: Node.isMethodDeclaration
	
};

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