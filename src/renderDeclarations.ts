import { Node, ObjectLiteralExpression, SourceFile, TypeAliasDeclaration, TypedNode, VariableDeclaration } from "ts-morph";
import { $doc, $h, $kd, $kind, $s, $section, $t, Headings } from "./decorators";
import TS from "./TS";
import { getComments, getDocPath, getExample, getFullName, getName, isPrivate } from "./node-tools";
import { writeFileSync, writeSync } from "fs";
import { getSignature } from "./node-signature";
import { Nodely } from "./types";
import { traverse } from "./traverse";
import { blue, green } from "console-log-colors";
import { fromReturn } from "./signitors";

const  getChildrenLinks = (node: Nodely): Node[] => {
	
	if(Node.isUnionTypeNode(node) || Node.isIntersectionTypeNode(node)){
		return node.getTypeNodes().flatMap(getChildrenLinks);
	} else if (Node.isTupleTypeNode(node) || Node.isArrayLiteralExpression(node) || Node.isArrayLiteralExpression(node) || Node.isObjectBindingPattern(node)){
		return node.getElements().flatMap(getChildrenLinks);
	} else if (Node.isObjectLiteralExpression(node) || Node.isTypeLiteral(node)){
		return node.getProperties().flatMap(getChildrenLinks)
	} else if (Node.isPropertyDeclaration(node) || Node.isTypeReference(node) || Node.isPropertySignature(node)){
		return [node]
	}

	return [];
}


/**
 * @param node 
 * @returns 
 */
const getProperties = (node: Nodely): string[] => {
	const properties = [];
	if(isPrivate(node)) return [];
	if(Node.isInitializerExpressionGetable(node) || Node.isInitializerExpressionable(node)){
		properties.push(...getProperties(node.getInitializer()));
	}
	if(Node.isTypeAliasDeclaration(node)){
		properties.push(...getProperties(node.getTypeNode()));
	} else if(Node.isTypeElementMembered(node)){
		properties.push(...node.getProperties().map(n=>renderPropLink(n, 4)));
	} else if (Node.isUnionTypeNode(node) || Node.isIntersectionTypeNode(node)) {
		properties.push(...node.getTypeNodes().flatMap(getProperties));
	} else if (Node.isArrayBindingPattern(node)){
		properties.push(...node.getElements().flatMap(getProperties))
	} 
	return properties;
}

const getMembers = (node: Nodely): string[] => {
	if(Node.isClassLikeDeclarationBase(node)) return node.getInstanceMembers().filter(n=>!isPrivate(n)).map(n=>renderPropLink(n,6));
	if(Node.isVariableDeclaration(node)){
		const tn = node.getInitializer();
		if(Node.isClassExpression(tn)) return tn.getInstanceMembers().filter(n=>!isPrivate(n)).map(n=>renderPropLink(n, 6));
		if(Node.isObjectLiteralExpression(tn)) return tn.getProperties().filter(n=>!isPrivate(n)).map(n=>renderPropLink(n,6));
	}
	if(Node.isInterfaceDeclaration(node)) return node.getMembers().filter(n=>!isPrivate(n)).map(n=>renderPropLink(n, 6));
	return [];
}

const getStaticMembers = (node: Nodely): string[] => {
	if(Node.isClassLikeDeclarationBase(node)) return node.getStaticMembers().map(n=>renderPropLink(n,6));
	return [];
}

const getKind = (node: Node):string => {
	if(Node.isTypeAliasDeclaration(node)) return 'type';
	if(Node.isVariableDeclaration(node)) return node.getVariableStatement()?.getDeclarationKind() ?? "const";
	if(Node.isClassDeclaration(node)) return 'class';
	if(Node.isPropertySignature(node) || Node.isPropertyAssignment(node)) return 'property'; //todo check if its a method
	if(Node.isMethodSignature(node)) return 'method';
	if(Node.isFunctionDeclaration(node)) return 'function';
	if(Node.isParameterDeclaration(node)) return 'argument';
	if(Node.isPropertyDeclaration(node)) return (node.isStatic() ? 'static ':'') + 'property'; //todo check if its a method
	if(Node.isMethodDeclaration(node)) return (node.isStatic() ? 'static ':'') + 'method';
	if(Node.isGetAccessorDeclaration(node)) return (node.isStatic() ? 'static ':'') + 'get';
	if(Node.isSetAccessorDeclaration(node)) return (node.isStatic() ? 'static ':'') + 'set';
	if(Node.isConstructorDeclaration(node)) return 'constructor';
	if(Node.isInterfaceDeclaration(node)) return 'interface';
	TS.err("No kind support", node.getKindName());
	return 'no support'
}
const getTypeParameters = (node: Node) => {
	return Node.isTypeParametered(node) ? node.getTypeParameters().map(getSignature).join('\n * ')
	:'';
}
const getArguments = (node: Node):string[] => {
	if(Node.isParametered(node)) return node.getParameters().map(n=>render(n, 4));
	//It makes sense that the initializer type node take precedence. Allows for later support to display default values.
	if(Node.isInitializerExpressionGetable(node)) {
		const tn = node.getInitializer();
		if(Node.isParametered(tn)) {
			return getArguments(tn);
		}
	}
	if(Node.isTyped(node)){
		const tn = node.getTypeNode();
		if(Node.isParametered(tn)){
			return getArguments(tn);
		}
	}
	
	return []
}

const getConstructor = (node: Nodely): string[] => {
	if(Node.isVariableDeclaration(node)) return getConstructor(node.getInitializer())
	if(!(Node.isClassDeclaration(node) || Node.isClassExpression(node))) return [];
	return node.getConstructors().map(n=>render(n, 6));
}


const getReturns = (node: Node): string => {
	if(Node.isReturnTyped(node)) return fromReturn(node);
	
	if(Node.isTyped(node)){
		const tn = node.getTypeNode();
		if(Node.isReturnTyped(tn)) return fromReturn(tn);
	}
	if(Node.isInitializerExpressionGetable(node)) {
		const tn = node.getInitializer();
		if(Node.isReturnTyped(tn)) return fromReturn(tn);
	}
	return ''
}

/**
 * Instead of a full render method this generates a link title that can be used to go to a dedicated page.
 * @param node 
 * @param h 
 */
const renderPropLink = (node: Nodely, h: Headings) => {
	if(!node) return '';
	const path = getDocPath(node);
	if(!path) return '';
	documentDeclaration(node)
	return $t(h)`<a href="/?path=${path}">${$kind(getKind(node))} ${getName(node)}</a>`;
}

const render = (node: Nodely, h: Headings = 2) => {
	if(!node) return '';
	return $s(h, getKind(node), node) + $section(
		getComments(node),
		$section(getConstructor(node).join('\n---\n')).wrap($kd`**Constructors**:`+'\n', '\n', false),
		getTypeParameters(node).wrap($kd`**Type Parameters**:`+'\n\n * ', '\n', false),
		$section(getProperties(node).join('\n---\n')).wrap($kd`**Type Properties**:`+'\n', '\n', false),
		$section(getArguments(node).join('\n---\n')).wrap($kd`**Arguments**:`+'\n', '\n', false),
		getReturns(node).wrap($kd`**Returns**: `, '\n', false),
		getExample(node),
		$section(getMembers(node).join('\n---\n')).wrap($kd`**Properties**:` + '\n', '\n', false),
		$section(getStaticMembers(node).join('\n---\n')).wrap($kd`**Static Properties**:` + '\n', '\n', false),
	);
}



export const documentDeclaration = (node: Node) => {
	const title = TS.resolveUrl(node.getSourceFile().getFilePath()) + '/'+ getFullName(node, '/');
	const docPath = TS.resolvedDocFilePath(title);
	const data = render(node);
	
	if(!data){
		TS.err(node.getKindName());
		return
	}
	writeFileSync(docPath, $doc(data, title));
}

export const documentDeclarations = (source: SourceFile) => {
	TS.warn(source.getFilePath());
	for(const node of traverse(source)){
		documentDeclaration(node)
	}
}
