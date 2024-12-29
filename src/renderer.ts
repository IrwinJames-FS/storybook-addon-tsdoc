import { ArrowFunction, FunctionDeclaration, FunctionExpression, FunctionTypeNode, MethodDeclaration, MethodSignature, NamedTupleMember, Node, ParameterDeclaration, PropertyDeclaration, PropertySignature, SourceFile, Type, TypeParameterDeclaration } from "ts-morph";
import { Nodely } from "./types";
import TS from "./TS";
import { bySyntax } from "./SyntaxKindDelegator";
import SK, { SKindMap } from "./SyntaxKindDelegator.types";
import { $h, $href, $kd, $kind, $link, $s, $section, $t, $type } from "./decorators";
import { cyan, red, yellow } from "console-log-colors";
import { declarationOfType, getComments, getDocPath, getExample, getFullName, getName, getTypeNode, isMethodLike, isPrimitive, isPrivate, isStatic } from "./node-tools";
import { fromType, getModifiers, getSignature, getSignatureFromType } from "./node-signature";
import { STORY_BOOK_BLOCK } from "./constants";


/**
 * Standardizes the properties handled by different function like declarations and expressions.
 * @param typeParams 
 * @param args 
 * @param returnNode 
 * @returns 
 */
const renderFNDetails = (node: FunctionTypeNode | FunctionDeclaration | FunctionExpression | MethodDeclaration | MethodSignature | ArrowFunction) => {
	const tp = build(...node.getTypeParameters());
	const ag = build(...node.getParameters());
	const rt = build(node.getReturnTypeNode()) || buildFromType(node.getReturnType());
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
 * Just a convenience to be used to generate a section from a node or nodes if any content is generated.
 * @param nodes 
 * @returns 
 */
const $sec = (...nodes: Nodely[]) => $section(build(...nodes));

/**
 * This method will act as a central point to interface with JSDocs. 
 * 
 * *note:* Some tags will require more integrated support and at this time I am still deciding on the precedent JSDoc should get vs typescript declarations.
 * 
 * But this is a place I can modify the code for all doc blocks in a centeral location 
 * @param node 
 * @returns 
 */
const getDocs = (node: Node)=>block(getComments(node), getExample(node));
/**
 * Tweaking node handling via syntax kind
 */
const RENDER_MAP: SKindMap<string> = {
	[SK.TypeAliasDeclaration]: node => block(
		$s(2, 'type', node),
		getDocs(node),
		$sec(
			...node.getTypeParameters(),
			node.getTypeNode()
		)
	),
	[SK.TupleType]: node => build(...node.getElements()),
	[SK.NamedTupleMember]: node=>block(
		$s(4, 'tuple item', node),
		getDocs(node),
		$section(build(node.getTypeNode()))
	),
	[SK.TypeLiteral]: node => {
		const members = build(...node.getMembers());
		return members ? $section(
			$t(4)`Members: `,
			members
		):''
	},
	[SK.PropertySignature]: node=>block(
		$s(4, 'property', node),
		getDocs(node),
		$sec(getTypeNode(node)),
	),
	[SK.PropertyDeclaration]: node=>block(
		$s(4, 'property', node),
		getDocs(node),
		$sec(getTypeNode(node)),
	),
	[SK.MethodSignature]: node=>{
		return block(
			$s(4, 'method', node),
			$h(4, node, $kd`method`, node.getName(), ':', getSignature(node)),
			getComments(node),
			getExample(node),
			...renderFNDetails(node)
		)
	},
	//unlike the method signature
	[SK.FunctionType]: node=>block(...renderFNDetails(node)),
	[SK.ArrowFunction]: node => block(...renderFNDetails(node)),
	[SK.FunctionExpression]: node => block(...renderFNDetails(node)),
	[SK.MethodDeclaration]: node=>{
		return block(
			$h(4, node, $kd`${node.isStatic() ? 'static ':''}method`, node.getName(), ':', getSignature(node)),
			getComments(node),
			getExample(node),
			...renderFNDetails(node)
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
	[SK.ClassDeclaration]:node => block(
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
			build(...node.getConstructors()),
			build(...node.getStaticBlocks()),
			build(...node.getStaticProperties()),
			build(...node.getStaticMethods()),
			build(...node.getInstanceProperties()),
			build(...node.getInstanceMethods())
		)
	),
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
			$section(
				build(...node.getProperties()),
				build(...node.getMethods())
			)
		);
	},
	[SK.ExpressionWithTypeArguments]: node=>build(...node.getTypeArguments()),
	[SK.GetAccessor]: node=> block(
		$h(4, node, $kd`${node.isStatic() ? 'static ':''}get`, getName(node), ':', getSignature(node)),
		getComments(node),
		getExample(node)
	),
	[SK.SetAccessor]: node=>block(
		$h(4, node, $kd`${node.isStatic() ? 'static ':''}set`, getName(node), ':', getSignature(node)),
		getComments(node),
		getExample(node)
	),
	[SK.ConditionalType]: node=>build(node.getExtendsType(), node.getTrueType(), node.getFalseType()),
	[SK.VariableStatement]: node => build(...node.getDeclarations()),
	[SK.VariableDeclaration]: node => {
		const statement = node.getVariableStatement();
		if(!statement) return '';
		return block(
			$h(4, node, $kd`${statement.getDeclarationKind()}`, getName(node), ':', getSignature(node)),
			getComments(statement),
			getExample(statement),
			build(node.getTypeNode() ?? node.getInitializer())
		)
	},
	[SK.ObjectBindingPattern]: node => build(...node.getElements()),
	[SK.BindingElement]: node => build(node.getPropertyNameNode()),
	[SK.IndexedAccessType]: node => build(node.getObjectTypeNode(), node.getIndexTypeNode()),
	[SK.FunctionDeclaration]: node => block(
		$h(4, node, $kd`function`, node.getName(), ':', getSignature(node))
	),
	[SK.ExpressionStatement]: node => '', //expressions are blocks of logic. Currently I dont plan on handling these instances. 
	[SK.ClassExpression]:node => block(
		$h(
			2, 
			node,  
			node.getName(),
			getSignature(node)
		),
		getComments(node),
		getExample(node),
		$section(
			build(...node.getConstructors()),
			build(...node.getStaticBlocks()),
			build(...node.getStaticProperties()),
			build(...node.getStaticMethods()),
			build(...node.getInstanceProperties()),
			build(...node.getInstanceMethods())
		)
	),
	[SK.ArrayLiteralExpression]: node => build(...node.getElements()),
	[SK.ObjectLiteralExpression]: node => block($section(build(...node.getProperties()))),
	[SK.PropertyAssignment]: node => block(
		$h(4, node, $kd`property`, getSignature(node)),
		getComments(node),
		getExample(node),
		build(node.getInitializer())
	),
	[SK.NewExpression]: ()=>``,
	[SK.ObjectKeyword]: ()=>'',
	[SK.TypePredicate]: ()=>'',
	[SK.CallExpression]: ()=>'',
	[SK.BinaryExpression]: ()=>''
};

//Again a way to ignore or not alert me of lacking support. it seems there should be an interface for this. 
const IGNOREKINDS = new Set([
	SK.ExportDeclaration,
	SK.MultiLineCommentTrivia,
	SK.SingleLineCommentTrivia
]);

export const buildFromType = (type: Type) => {
	const node = declarationOfType(type);
	if(!node) return;
	if(type.isAnonymous()) return build(node);
	return `<h4 className="ts-doc-header">${fromType(type)}</h4>`;
}
/**
 * Builds based on a list of nodes. 
 * @param nodes 
 * @returns 
 */
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