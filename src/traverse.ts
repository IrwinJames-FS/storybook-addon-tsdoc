import { Node } from "ts-morph";
import TS from "./TS";
import { Nodely } from "./types";
import { cyan } from "console-log-colors";
import { isPrivate } from "./node-tools";

export function* traverse(...nodes: Nodely[]): Generator<Node>{
	
	for(const node of nodes){
		if(Node.isSourceFile(node)) yield* traverse(...(node.getChildSyntaxList()?.getChildren() ?? []));
		else if((Node.isTypeAliasDeclaration(node) || Node.isClassDeclaration(node) || Node.isFunctionDeclaration(node) || Node.isInterfaceDeclaration(node))){
			if(!isPrivate(node)) yield node;
		} else if(Node.isVariableStatement(node)){
			if(!isPrivate(node)) yield* node.getDeclarations();
		} else if(node && !Node.isExportDeclaration(node) && !Node.isImportDeclaration(node) && !Node.isCommentStatement(node) && !Node.isExportAssignment(node) && !Node.isExpressionStatement(node)) {
			TS.err("Lacking support in traverse", node.getKindName(), node.getText());
		}
	}
}