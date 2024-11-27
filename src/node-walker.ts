import { isPrimitive } from "./node-tools";
import TS from "./TS";
import { Node } from "ts-morph";

export function* walk(...nodes: (Node | undefined)[]): Generator<Node> {
	for(const node of nodes){
		if(!node || isPrimitive(node) || Node.isTypeReference(node)) continue;
		if(Node.isSyntaxList(node)) {
			yield* walk(...node.getChildren());
			continue;
		}
		if(
			Node.isTypeAliasDeclaration(node) 
			|| Node.isPropertySignature(node)
			|| Node.isMethodSignature(node)
		){
			yield node;
		}
		if(Node.isTyped(node)){
			yield* walk(node.getTypeNode());
			continue;
		}

		if(Node.isTypeLiteral(node)){
			//const properties = node.getProperties();
			//const members = node.getMembers();
			//const methods = node.getMethods();
			//TS.err(properties.length, members.length, methods.length);
			//yield* walk(...node.getProperties());
			yield* walk(...node.getMembers());
			//yield* walk(...node.getMethods());
			continue;
		}

		if(Node.isFunctionTypeNode(node) || Node.isMethodSignature(node)){
			yield* walk(node.getReturnTypeNode());
			continue;
		}
		
		if(Node.isArrayTypeNode(node)){
			yield* walk(node.getElementTypeNode())
			continue;
		}

		if(Node.isUnionTypeNode(node) || Node.isIntersectionTypeNode(node)){
			yield* walk(...node.getTypeNodes());
			continue;
		}
		
		TS.err("No support", node.getKindName());
	}
	
}