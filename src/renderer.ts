import { Node, ParameterDeclaration, PropertyDeclaration, SourceFile, TypeParameterDeclaration } from "ts-morph";
import { Nodely } from "./types";
import TS from "./TS";
import { bySyntax } from "./SyntaxKindDelegator";
import SK, { SKindMap } from "./SyntaxKindDelegator.types";
import { $h, $kd, $kind, $section } from "./decorators";
import { cyan, red, yellow } from "console-log-colors";
import { getComments, getExample, getFullName, getName, isMethodLike, isPrimitive, isPrivate } from "./node-tools";
import { getModifiers, getSignature } from "./node-signature";
import { STORY_BOOK_BLOCK } from "./constants";

/**
 * Standardizes the properties handled by different function like declarations and expressions.
 * @param typeParams 
 * @param args 
 * @param returnNode 
 * @returns 
 */
const renderFNDetails = (typeParams: TypeParameterDeclaration[], args: ParameterDeclaration[], returnNode?: Node) => {
	const tp = build(...typeParams);
	const ag = build(...args);
	const rt = build(returnNode);
	return [
		...tp ? [
			$section(
				'---',
				$h(5, undefined, "Type Arguments:"),
				tp
			) 
		]:[],
		...ag ? [
			$section(
				'---',
				$h(5, undefined, "Arguments:"),
				ag
			)
		]:[],
		...rt ? [
			$section(
				'---',
				$h(5, undefined, "Returns:"),
				rt
			)
		]:[]
	]
}

/**
 * Just a convenient way to combine strings as blocks of text within a file.
 * @param blocks 
 * @returns 
 */
const block = (...blocks: string[]) => blocks.filter(b=>b.trim()).join('\n');


/**
 * Tweaking node handling via syntax kind
 */
const RENDER_MAP: SKindMap<string> = {
	[SK.TypeAliasDeclaration]: node => {
		const tn = node.getTypeNode();
		const args = node.getTypeParameters();
		const tArgs = build(...args);
		const typed = build();
		return block(
			$h(2, node, $kd`type`, node.getName()+`${args.map(getSignature).join(', ').wrap('<', '>')}`, ':', getSignature(tn)),
			getComments(node),
			getExample(node),
			tArgs ? $section(tArgs):'',
			typed ? $section(typed):''
		);
	},
	[SK.TupleType]: node => build(...node.getElements()),
	[SK.NamedTupleMember]: node => {
		const tn = node.getTypeNode();
		const typed = build(tn);
		return block(
			$h(4, node, $kd`tuple item`, node.getName(), ':', getSignature(tn)),
			getComments(node),
			getExample(node),
			typed ? $section(typed):''
		)
	},
	[SK.TypeLiteral]: node => {
		const properties = node.getProperties();
		const methods = node.getMethods();
		return block(
			properties.length ? $h(5, undefined, 'Properties:'):'',
			build(...properties),
			methods.length ? $h(5, undefined, 'Methods:'):'',
			build(...methods)
		)
	},
	[SK.PropertySignature]: node=>{
		const tn = node.getTypeNode();
		const typed = build(tn);
		return block(
			$h(4, node, getModifiers(node), $kd`${isMethodLike(tn) ? 'method1':'property1'}`, node.getName(), node.hasQuestionToken() ? '?':'', ':', getSignature(tn)),
			getComments(node),
			getExample(node),
			typed ? $section(typed):''
		);
	},
	[SK.PropertyDeclaration]: node=>{
		const tn = node.getTypeNode();
		const typed = build(tn);
		return block(
			$h(4, node, $kd`${node.isStatic() ? 'static ':''}${isMethodLike(tn) ? 'method':'property'}`, node.getName(), ':', getSignature(tn)),
			getComments(node),
			getExample(node),
			typed ? $section(typed):''
		);
	},
	[SK.MethodSignature]: node=>{
		return block(
			$h(4, node, $kd`method`, node.getName(), ':', getSignature(node)),
			getComments(node),
			getExample(node),
			...renderFNDetails(
				node.getTypeParameters(),
				node.getParameters(),
				node.getReturnTypeNode()
			)
		)
	},
	//unlike the method signature
	[SK.FunctionType]: node=>{
		return block(
			...renderFNDetails(
				node.getTypeParameters(),
				node.getParameters(),
				node.getReturnTypeNode()
			),
		);
	},
	[SK.MethodDeclaration]: node=>{
		return block(
			$h(4, node, $kd`${node.isStatic() ? 'static ':''}method`, node.getName(), ':', getSignature(node)),
			getComments(node),
			getExample(node),
			...renderFNDetails(
				node.getTypeParameters(),
				node.getParameters(),
				node.getReturnTypeNode()
			)
		)
	},
	[SK.Parameter]: node=>{
		
		return block(
			$h(4, node, $kd`argument`, getSignature(node)),
			getComments(node),
			getExample(node),
			Node.isObjectBindingPattern(node.getNameNode()) ? build(node.getNameNode()):''
		)
	},
	[SK.TypeParameter]: node=>{
		const constraint = build(node.getConstraint());
		if(!constraint) return '';
		return block(
			$h(4, node, $kd`param`, getSignature(node)),
			getComments(node),
			getExample(node),
			constraint ? $section(constraint):''
		)
	},
	[SK.TypeReference]: node=>'',
	[SK.UnionType]: node => build(...node.getTypeNodes()),
	[SK.IntersectionType]: node => build(...node.getTypeNodes()),
	[SK.ArrayType]: node => build(node.getElementTypeNode()),
	[SK.ClassDeclaration]:node => {
		const constructors = build(...node.getConstructors());
		const staticBlocks = build(...node.getStaticBlocks());
		const staticProperties = build(...node.getStaticProperties());
		const staticMethods = build(...node.getStaticMethods());
		const instanceProperties = build(...node.getInstanceProperties());
		const instanceMethods = build(...node.getInstanceMethods());
		return block(
			$h(
				2, 
				node, 
				$kd`class`, 
				node.getName(),
				getSignature(node)
			),
			getComments(node),
			getExample(node),
			$section(
				constructors,
				staticBlocks,
				staticProperties,
				staticMethods,
				instanceProperties,
				instanceMethods
			)
		)
	},
	[SK.ClassStaticBlockDeclaration]: node=>{
		const comments = getComments(node).trim();
		return comments ? block(
			$h(4, undefined, $kd`static block:`),
			comments,
			getExample(node)
		):''
	},
	[SK.Constructor]: node=>block(
		$h(4, node, $kd`constructor`, getSignature(node)),
		getComments(node),
		getExample(node)
	),
	[SK.InterfaceDeclaration]: node=>{
		const typeParams = build(...node.getTypeParameters());
		const extensions = build(...node.getExtends());
		
		const properties: Node[] = [];
		const methods: Node[] = [];
		for(const nds of node.getProperties()){
			if(isMethodLike(nds.getTypeNode())) methods.push(nds);
			else properties.push(nds);
		}
		methods.push(...node.getMethods());
		let data = '';
		if(properties.length) data += $h(5, undefined, 'Properties:') + `
${build(...properties)}`;
		if(methods.length) data += $h(5, undefined, 'Methods:') + `
${build(...methods)}`;
		return block(
			$h(4, node, $kd`interface`, node.getName(), getSignature(node)),
			...(typeParams ? [
				'---',
				$h(5, undefined, 'Type Parameters:'),
				$section(typeParams)
			]:[]),
			...(extensions ? [
				'---',
				$h(5, undefined, 'Extends:'),
				$section(typeParams)
			]:[]),
			$section(data)
		);
	},
	[SK.ExpressionWithTypeArguments]: node=>{
		return build(...node.getTypeArguments())
	},
	[SK.GetAccessor]: node=>{
		return block(
			$h(4, node, $kd`${node.isStatic() ? 'static ':''}get`, getName(node), ':', getSignature(node))
		)
	},
	[SK.SetAccessor]: node=>{
		return block(
			$h(4, node, $kd`${node.isStatic() ? 'static ':''}set`, getName(node), ':', getSignature(node))
		)
	},
	[SK.ConditionalType]: node=>build(node.getExtendsType(), node.getTrueType(), node.getFalseType()),
	[SK.VariableStatement]: node => {
		return build(...node.getDeclarations())
	},
	[SK.VariableDeclaration]: node => {
		const statement = node.getVariableStatement();
		
		if(!statement) return '';
		const dk = statement.getDeclarationKind();
		const tn = node.getTypeNode();
		const initializer = node.getInitializer();
		return block(
			$h(4, node, $kd`${dk}`, getName(node), ':', getSignature(node)),
			getComments(statement),
			getExample(statement),
			build(tn ?? initializer)
		)
	},
	[SK.ObjectBindingPattern]: node => {
		return build(...node.getElements());
	},
	[SK.BindingElement]: node => {
		return build(node.getPropertyNameNode())
	},
	[SK.IndexedAccessType]: node => {
		return build(node.getObjectTypeNode(), node.getIndexTypeNode());
	},
	[SK.FunctionDeclaration]: node => {
		return block(
			$h(4, node, $kd`function`, node.getName(), ':', getSignature(node))
		)
	},
	[SK.ExpressionStatement]: node => '', //expressions are blocks of logic. Currently I dont plan on handling these instances. 
	[SK.ClassExpression]:node => {
		const constructors = build(...node.getConstructors());
		const staticBlocks = build(...node.getStaticBlocks());
		const staticProperties = build(...node.getStaticProperties());
		const staticMethods = build(...node.getStaticMethods());
		const instanceProperties = build(...node.getInstanceProperties());
		const instanceMethods = build(...node.getInstanceMethods());
		return block(
			$h(
				2, 
				node, 
				$kd`class`, 
				node.getName(),
				getSignature(node)
			),
			getComments(node),
			getExample(node),
			$section(
				constructors,
				staticBlocks,
				staticProperties,
				staticMethods,
				instanceProperties,
				instanceMethods
			)
		)
	},
	[SK.ArrayLiteralExpression]: node => build(...node.getElements()),
	[SK.ObjectLiteralExpression]: node => block($section(build(...node.getProperties()))),
	[SK.PropertyAssignment]: node => block(
		$h(4, node, $kd`property`, getSignature(node)),
		getComments(node),
		getExample(node),
		build()
	),
	[SK.ArrowFunction]: node => build(node.getReturnTypeNode()),
	[SK.NewExpression]: ()=>``
};

const IGNOREKINDS = new Set([
	SK.ExportDeclaration,
	SK.MultiLineCommentTrivia,
	SK.SingleLineCommentTrivia
]);


export const build = (...nodes: Nodely[]) => nodes.map(node=>{
	if(!TS.documentPrivate && isPrivate(node)) return '';
	return bySyntax(node, RENDER_MAP, n=>{
		if(!n || isPrimitive(n)) return '';
		TS.err("No support", red(n.getKindName()), cyan(n.getKind()), n.getText(), getFullName(n));
		return '';
})}).filter(b=>b.trim()).join('\n');

export const renderer = (node: Nodely, df: (node: Nodely)=>string=n=>{
	if(!n || isPrimitive(n) || IGNOREKINDS.has(n.getKind())) return '';
	TS.err("No support", red(n.getKindName()), yellow(n.getKind()), getFullName(n));
	return '';
}) => bySyntax(node, RENDER_MAP, df);

/**
 * A conveniece to render a source file.
 * @param node 
 * @returns 
 */
export const render = (title: string, node: SourceFile) => {
	const data = node.getChildSyntaxList()?.getChildren().map(c=>renderer(c)).filter(n=>!!n.replace(/\s/g, '')).join('\n---\n');
	if(!data) return;
	return `${STORY_BOOK_BLOCK}
<Meta title="${title}"/>

${data}`
}