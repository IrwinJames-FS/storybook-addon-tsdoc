import { $kind, $literal, $type } from "./decorators";
import { sig } from "./node-signature";
import { getName } from "./node-tools";
import { arrayLiteral, classDeclaration, enummember, fnSignature, fromName, fromType, fromTypeNode, getAccessor, getOperator, identifier, interfaceDeclaration, intersectionType, literal, literalType, namedTupleMember, newExpression, objLiteral, parameter, propertyAccessExpression, propertyDecSig, typeAliasDeclaration, typeParameter, typeReference, unionType, variableDeclaration } from "./signitors";
import { combineSyntax } from "./SyntaxKindDelegator";
import SK, { SKindMap } from "./SyntaxKindDelegator.types";
import { escape } from "./utils";

export const nodeSignatureMap: SKindMap<string> = {
	[SK.ArrayType]: node=>sig(node.getElementTypeNode())+'[]',
	[SK.ParenthesizedType]: node=>`(${fromTypeNode(node)})`,
	[SK.Constructor]: node=>`${$type("new")} (${node.getParameters().map(p=>sig(p)).join(', ')})=>${$type(getName(node.getParent()))}`,
	[SK.SetAccessor]: node=> node.getParameters().map(p=>sig(p)).join(', '),
	[SK.ConditionalType]: node => `${sig(node.getCheckType())} extends ${sig(node.getExtendsType())} ? ${sig(node.getTrueType())}<br/>: ${sig(node.getFalseType())}`,
	[SK.ExpressionWithTypeArguments]: node => `${sig(node.getExpression())}${node.getTypeArguments().map(a=>sig(a)).join(', ').wrap('<','>')}`,
	[SK.RestType]: node => `...${fromTypeNode(node)}`,
	[SK.QualifiedName]: node => `${sig(node.getLeft())}.${sig(node.getRight())}`,
	[SK.TypePredicate]: node => `${sig(node.getParameterNameNode())} ${node.hasAssertsModifier() ? sig(node.getAssertsModifier()):'is'} ${sig(node.getTypeNode())}`,
	[SK.TypeOperator]: node => `${$kind(getOperator(node))} ${fromTypeNode(node)}`,
	[SK.BinaryExpression]: node => `${sig(node.getLeft())} ${sig(node.getOperatorToken())} ${sig(node.getRight())}`,
	[SK.CallExpression]: node => fromType(node.getReturnType()),
	[SK.IndexedAccessType]: node => `${sig(node.getObjectTypeNode())}[${node.getIndexTypeNode()}]`,
	...combineSyntax([SK.FunctionDeclaration,SK.FunctionExpression,SK.MethodDeclaration,SK.FunctionType,SK.MethodSignature,SK.ArrowFunction], fnSignature),
	...combineSyntax([SK.PropertySignature, SK.PropertyDeclaration, SK.PropertyAssignment], propertyDecSig),
	...combineSyntax([SK.BindingElement], fromTypeNode),
	...combineSyntax([SK.ArrayLiteralExpression, SK.TupleType, SK.ArrayBindingPattern], arrayLiteral),
	...combineSyntax([SK.ObjectLiteralExpression, SK.ObjectBindingPattern, SK.TypeLiteral], objLiteral),
	...combineSyntax([SK.AsteriskAsteriskEqualsToken, SK.AsteriskAsteriskToken, SK.AsteriskEqualsToken, SK.AsteriskToken, SK.PlusToken, SK.PlusPlusToken, SK.PlusEqualsToken, SK.MinusToken, SK.MinusEqualsToken, SK.MinusEqualsToken, SK.SlashToken, SK.SlashEqualsToken, SK.LessThanToken, SK.LessThanEqualsToken, SK.GreaterThanEqualsToken], node=>escape(node.getText())),
	...combineSyntax([SK.StringLiteral, SK.NumericLiteral, SK.BigIntLiteral, SK.TrueKeyword, SK.FalseKeyword], literal),
	[SK.TypeAliasDeclaration]: typeAliasDeclaration,
	[SK.TypeReference]: typeReference,
	[SK.TypeParameter]: typeParameter,
	[SK.NamedTupleMember]: namedTupleMember,
	[SK.PropertyAccessExpression]: propertyAccessExpression,
	[SK.UnionType]: unionType,
	[SK.IntersectionType]: intersectionType,
	[SK.LiteralType]: literalType,
	[SK.Identifier]: identifier,
	[SK.Parameter]: parameter,
	[SK.ClassDeclaration]: classDeclaration,
	[SK.ClassExpression]: classDeclaration,
	[SK.InterfaceDeclaration]: interfaceDeclaration,
	[SK.GetAccessor]: getAccessor,
	[SK.VariableDeclaration]: variableDeclaration,
	[SK.NewExpression]: newExpression,
	[SK.ObjectKeyword]: ()=>'&lcub;&rcub;',
	[SK.StringLiteral]: node => $literal(escape(node.getText())),
	[SK.NumericLiteral]: node => $literal(node.getText()),
	[SK.EnumDeclaration]: fromName,
	[SK.EnumMember]: enummember
}