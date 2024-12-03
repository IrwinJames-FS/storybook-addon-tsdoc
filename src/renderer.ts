import { Node, ParameterDeclaration, SourceFile, TypeParameterDeclaration } from "ts-morph";
import { Nodely } from "./types";
import TS from "./TS";
import { bySyntax } from "./SyntaxKindDelegator";
import SK, { SKindMap } from "./SyntaxKindDelegator.types";
import { $h, $kd, $section } from "./decorators";
import { red } from "console-log-colors";
import { getComments, isMethodLike, isPrimitive } from "./node-tools";
import { getSignature } from "./node-signature";

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

const block = (...blocks: string[]) => blocks.filter(b=>b).join('\n');
const RENDER_MAP: SKindMap<string> = {
	[SK.TypeAliasDeclaration]: node => {
		const tn = node.getTypeNode();
		const args = node.getTypeParameters();
		const tArgs = build(...args);
		const typed = build(tn);
		return block(
			$h(2, node, $kd`type`, node.getName()+`${args.length ? '&lt;'+args.map(a=>getSignature(a)).join(', ')+'&gt;':''}`, ':', getSignature(tn)),
			getComments(node),
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
			typed ? $section(typed):''
		)
	},
	[SK.TypeLiteral]: node => {
		const properties: Node[] = [];
		const methods: Node[] = [];
		for(const nds of node.getProperties()){
			const tn = nds.getTypeNode();
			if(isMethodLike(nds.getTypeNode())) methods.push(nds);
			else properties.push(nds);
		}
		methods.push(...node.getMethods());
		let data = '';
		if(properties.length) data += $h(5, undefined, 'Properties:') + `
${build(...properties)}`;
		if(methods.length) data += $h(5, undefined, 'Methods:') + `
${build(...methods)}`;
		return data;
	},
	[SK.PropertySignature]: node=>{
		const tn = node.getTypeNode();
		const typed = build(tn);
		return block(
			$h(4, node, isMethodLike(tn) ? $kd`method`:$kd`property`, node.getName(), ':', getSignature(tn)),
			getComments(node),
			typed ? $section(typed):''
		);
	},
	[SK.MethodSignature]: node=>{
		return block(
			$h(4, node, $kd`method`, node.getName(), ':', getSignature(node)),
			getComments(node),
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
			$h(4, node, $kd`method`, node.getName(), ':', getSignature(node)),
			getComments(node),
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
			getComments(node)
		)
	},
	[SK.TypeParameter]: node=>{
		const constraint = build(node.getConstraint());
		if(!constraint) return '';
		return block(
			$h(4, node, $kd`param`, getSignature(node)),
			getComments(node),
			constraint ? $section(constraint):''
		)
	},
	[SK.TypeReference]: node=>'',
	[SK.UnionType]: node => build(...node.getTypeNodes()),
	[SK.IntersectionType]: node => build(...node.getTypeNodes()),
	[SK.ArrayType]: node => build(node.getElementTypeNode()),
	[SK.ClassDeclaration]:node => {
		const extension = build(node.getExtends());
		const implementsions = build(...node.getImplements());
		const properties: Node[] = [];
		const methods: Node[] = [];
		for(const nds of node.getProperties()){
			const tn = nds.getTypeNode();
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
			$h(
				2, 
				node, 
				$kd`class`, 
				node.getName(),
				getSignature(node)
			),
			$section(extension),
			$section(implementsions),
			$section(data)
		)
	},
	[SK.InterfaceDeclaration]: node=>{
		const typeParams = build(...node.getTypeParameters());
		const extensions = build(...node.getExtends())
		const properties: Node[] = [];
		const methods: Node[] = [];
		for(const nds of node.getProperties()){
			const tn = nds.getTypeNode();
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
	}
};


export const build = (...nodes: Nodely[]) => nodes.map(node=>bySyntax(node, RENDER_MAP, n=>{
	if(!n || isPrimitive(n)) return '';
	TS.err("No support", red(n.getKindName()));
	return '';
})).join('\n');

export const renderer = (node: Nodely, df: (node: Nodely)=>string=n=>{
	if(!n || isPrimitive(n)) return '';
	TS.err("No support", red(n.getKindName()));
	return '';
}) => bySyntax(node, RENDER_MAP, df);

/**
 * A conveniece to render a source file.
 * @param node 
 * @returns 
 */
export const render = (title: string, node: SourceFile) => {
	const data = node.getChildSyntaxList()?.getChildren().map(c=>renderer(c)).join('\n');
	if(!data) return;
	return `import { Meta } from "@storybook/blocks";
		
<Meta title="${title}"/>

${data}

${TS.style}`
}