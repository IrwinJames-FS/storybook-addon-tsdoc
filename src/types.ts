import { Node } from "ts-morph";

export interface Nameable extends Node {
	getName: ()=>string
}

export interface Declaration {
	title: string
	docPath: string
	name: string
	type: string
	kind: string
	typeArguments: string[],
	node: Node
}

export interface DeclarationType {
	name: string
}