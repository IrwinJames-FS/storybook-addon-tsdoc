import { ArrayBindingPattern, ArrayLiteralExpression, ArrayTypeNode, ArrowFunction, BinaryExpression, BindingElement, CallExpression, ClassDeclaration, ClassStaticBlockDeclaration, ConditionalTypeNode, ConstructorDeclaration, ExportDeclaration, Expression, ExpressionWithTypeArguments, FunctionDeclaration, FunctionExpression, FunctionTypeNode, GetAccessorDeclaration, Identifier, IndexedAccessTypeNode, InterfaceDeclaration, IntersectionTypeNode, LiteralTypeNode, MethodDeclaration, MethodSignature, NamedTupleMember, Node, NumericLiteral, ObjectBindingPattern, ObjectLiteralExpression, ParameterDeclaration, ParenthesizedTypeNode, PropertyAccessExpression, PropertyDeclaration, PropertySignature, QualifiedName, RestTypeNode, SetAccessorDeclaration, SyntaxKind as SK, SourceFile, StringLiteral, SyntaxList, TupleTypeNode, TypeAliasDeclaration, TypeLiteralNode, TypeOperatorTypeNode, TypeParameterDeclaration, TypePredicateNode, TypeReferenceNode, UnionTypeNode, VariableDeclaration, VariableStatement } from "ts-morph";
import { SyntaxKindValidatorMap } from "./SyntaxKindDelegator.types";
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

export const SyntaxKindDelegator: SyntaxKindValidatorMap = {
	[SK.SourceFile]: Node.isSourceFile,
	[SK.SyntaxList]: Node.isSyntaxList,
	[SK.TypeAliasDeclaration]: Node.isTypeAliasDeclaration,
	[SK.StringKeyword]: Node.isStringKeyword,
	[SK.NumberKeyword]: Node.isNumberKeyword,
	[SK.BooleanKeyword]: Node.isBooleanKeyword,
	[SK.NeverKeyword]: Node.isNeverKeyword,
	[SK.NullKeyword]: Node.isNode,
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
	[SK.MethodDeclaration]: Node.isMethodDeclaration,
	[SK.PropertyDeclaration]: Node.isPropertyDeclaration,
	[SK.Constructor]: Node.isConstructorDeclaration,
	[SK.ArrayLiteralExpression]: Node.isArrayLiteralExpression,
	[SK.ClassStaticBlockDeclaration]: Node.isClassStaticBlockDeclaration,
	[SK.GetAccessor]: Node.isGetAccessorDeclaration,
	[SK.SetAccessor]: Node.isSetAccessorDeclaration,
	[SK.ConditionalType]: Node.isConditionalTypeNode,
	[SK.VariableStatement]: Node.isVariableStatement,
	[SK.VariableDeclaration]: Node.isVariableDeclaration,
	[SK.FunctionExpression]: Node.isFunctionExpression,
	[SK.ArrowFunction]: Node.isArrowFunction,
	[SK.ObjectLiteralExpression]: Node.isObjectLiteralExpression,
	[SK.ObjectBindingPattern]: Node.isObjectBindingPattern,
	[SK.BindingElement]: Node.isBindingElement,
	[SK.ArrayBindingPattern]: Node.isArrayBindingPattern,
	[SK.ExportDeclaration]: Node.isExportDeclaration,
	[SK.QualifiedName]: Node.isQualifiedName,
	[SK.TypePredicate]: Node.isTypePredicate,
	[SK.MultiLineCommentTrivia]: Node.isNode,
	[SK.TypeOperator]: Node.isTypeOperatorTypeNode,
	[SK.BinaryExpression]: Node.isBinaryExpression,
	[SK.PropertyAccessExpression]: Node.isPropertyAccessExpression,
	[SK.AsteriskToken]: Node.isNode,
	[SK.AsteriskAsteriskToken]: Node.isNode,
	[SK.AsteriskAsteriskEqualsToken]: Node.isNode,
	[SK.AsteriskEqualsToken]: Node.isNode,
	[SK.PlusToken]: Node.isNode,
	[SK.PlusPlusToken]: Node.isNode,
	[SK.PlusEqualsToken]: Node.isNode,
	[SK.MinusToken]: Node.isNode,
	[SK.MinusMinusToken]: Node.isNode,
	[SK.MinusEqualsToken]: Node.isNode,
	[SK.SlashToken]: Node.isNode,
	[SK.SlashEqualsToken]: Node.isNode,
	[SK.LessThanToken]: Node.isNode,
	[SK.LessThanEqualsToken]: Node.isNode,
	[SK.GreaterThanToken]: Node.isNode,
	[SK.GreaterThanEqualsToken]: Node.isNode,
	[SK.CallExpression]: Node.isCallExpression,
	[SK.RestType]: Node.isRestTypeNode,
	[SK.IndexedAccessType]: Node.isIndexedAccessTypeNode,
	[SK.FunctionDeclaration]: Node.isFunctionDeclaration

};