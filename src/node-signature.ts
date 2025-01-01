import { getDocPath, getFullName, getName, getTypeNode, isPrimitive } from "./node-tools";
import { ArrowFunction, FunctionDeclaration, FunctionExpression, FunctionTypeNode, MethodDeclaration, MethodSignature, Node, PropertyDeclaration, PropertySignature, ReturnTypedNode, Symbol, Type, TypeFormatFlags, TypeOperatorTypeNode } from "ts-morph";
import { bySyntax } from "./SyntaxKindDelegator";
import SK, { SKindMap } from "./SyntaxKindDelegator.types";
import { $href, $kd, $kind, $link, $literal, $name, $type } from "./decorators";
import { blue, cyan, gray, green, redBright, yellow, yellowBright } from "console-log-colors";
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

const fromReturn = (node: ReturnTypedNode) => {
	
	const tn = node.getReturnTypeNode();
	const s =  tn ? sig(tn)
	: fromType(node.getReturnType())
	return s;
}

const objLiteral = () => $literal(typelit);

const genTypes = (nodes: Node[], pre: string ='<', post: string = '>') => nodes.map(sig).join(', ').wrap(pre, post);

const isAsync = (node: Node) => {
	if(!('isAsync' in node) || typeof node.isAsync !== 'function') return false;
	return node.isAsync();
}
const isGenerator = (node: Node) => !('isGenerator' in node) || typeof node.isGenerator !== 'function' ? false:node.isGenerator();
	
/**
 * These two declaration types share a common signature. no point in repeating myself. 
 * @param node 
 * @returns 
 */
const propertyDecSig = (node: PropertyDeclaration | PropertySignature) => `${node.getModifiers().join(', ').wrap('', ' ')}${sig(node.getNameNode())}${node.hasQuestionToken() ? '?':''}: ${fromTypeNode(node)}`;

const fnSignature = (node: FunctionDeclaration | FunctionExpression | MethodDeclaration | FunctionTypeNode | MethodSignature | ArrowFunction) => `${isAsync(node) ? 'async ':''}${isGenerator(node) ? '*':''}${genTypes(node.getTypeParameters())}${getName(node)}(${genTypes(node.getParameters(), '', '')}) =&gt; ${fromReturn(node) || $literal('void')}`;


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
	[SK.CallExpression]: node => fromType(node.getReturnType()),
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
		return `${getName(node)} ${extensions ? ' extends '+ extensions:''}${implementions ? ' implements ' + implementions:''}`
	},
	[SK.ClassExpression]: node=>{
		const extensions = node.getExtends();
		const implementations = node.getImplements();
		return `${$kd`class`} ${extensions ? (' extends ' + sig(extensions)):''}${implementations.map(n=>` implements ${sig(n)}`)}${typelit}`;
	},
	[SK.InterfaceDeclaration]: node=>{
		const extensions = node.getExtends();
		return `${sig(node.getNameNode())}${extensions.map(node => ` extends ${sig(node)}`).join(' ')}`;
	},
	[SK.GetAccessor]: node=> `${node.getModifiers().map(m=>m.getText()).filter(n=>!!n.trim()).join(' ').wrap('', ' ')}${sig(node.getNameNode())}: ${fromReturn(node)}`,
	[SK.VariableDeclaration]: node => `${getName(node)}: ${fromTypeNode(node)}`,
	[SK.NewExpression]: node => `${sig(node.getExpression())}${genTypes(node.getTypeArguments())}`,
	[SK.ObjectKeyword]: () => `&lcub;&rcub;`,
	[SK.StringLiteral]: node => $literal(escape(node.getText())),
	[SK.NumericLiteral]: node=> $literal(node.getText()),
	[SK.BigIntLiteral]: node=>$literal(node.getText()),
	[SK.TrueKeyword]: node=>$literal(node.getText()),
	[SK.FalseKeyword]: node=>$literal(node.getText()),
	[SK.EnumDeclaration]: node=>`${sig(node.getNameNode())}`,
	[SK.EnumMember]: node=>{
		const initializer = node.getInitializer();
		return `${getName(node)}${initializer ? ': '+sig(initializer):''}`;
	}
}

/**
 * Converts modifier tokens to plain text
 * @todo style this maybe.
 * @param node 
 * @returns 
 */
export const getModifiers = (node: Node) => {
	if(!Node.isModifierable(node)) return [];
	return node.getModifiers().map(m=>m.getText()).join(' ')+' ';
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

const isPrimitiveType = (t: Type) => t.isAny() || t.isBigInt() || t.isNever() || t.isNull() || t.isNumber() || t.isString() || t.isBoolean() || t.isUndefined();

const isPrimitiveLiteral = (t: Type) => t.isBigIntLiteral() || t.isNumberLiteral() || t.isStringLiteral() || t.isTemplateLiteral() || t.isBooleanLiteral();

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


const logTypeInfo = (t: Type) => {
	const props = [
		'isAny',
		'isAnonymous',
		'isArray',
		'isBigInt',
		'isBigIntLiteral',
		'isClass',
		'isClassOrInterface',
		'isEnum',
		'isEnumLiteral',
		'isInterface',
		'isIntersection',
		'isLiteral',
		'isNever',
		'isNull',
		'isNullable',
		'isNumber',
		'isNumberLiteral',
		'isObject',
		'isReadonlyArray',
		'isString',
		'isStringLiteral',
		'isTemplateLiteral',
		'isTuple',
		'isTypeParameter',
		'isUndefined',
		'isUnion',
		'isUnionOrIntersection',
		'isUnknown',
		'isVoid',
	]

	console.log(t.getText(undefined, TypeFormatFlags.NoTruncation | TypeFormatFlags.UseFullyQualifiedType), cyan(t.getFlags()), blue(t.getObjectFlags()), props.map(n=>{
		if((t[n as keyof Type] as ()=>boolean)()) return green(n);
		return ''
	}).filter(n=>!!n.trim()).join('\n'), t.getBaseTypes(), t.getApparentType().getText(), redBright(t.getConstructSignatures().length), yellowBright(t.getCallSignatures().length));
}
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