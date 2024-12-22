import { Node } from "ts-morph"

export type TSDocOptions = {
	/**
	 * The path to the projects tsconfig file
	 */
	tsconfig: string

	/**
	 * The path to the projects documentation folder
	 */
	docs: string

	/**
	 * The path to the projects entry point
	 */
	entry: string

	/**
	 * should the document folder be cleared when run. If not the cleanup of omitted or incosistent code may be preserved between generations.
	 */
	shouldClearDocsOnStart: boolean

	/**
	 * The color kind name should be made when rendering
	 */
	kindColor: string

	/**
	 * The color types should be colored as when rendering
	 */
	typeColor: string

	/**
	 * The color that should be used as a reference type
	 */
	refColor: string

	/**
	 * The color used to color literal values
	 */
	litColor: string

	/**
	 * The color used to color name components in arguments and properties.
	 */
	nameColor: string
}

/**
 * Just a convenience type as optional but required arguments come up alot with ts-morph
 */
export type Nodely<T extends Node = Node> = T | undefined;