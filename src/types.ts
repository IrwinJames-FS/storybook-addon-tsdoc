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
	 * A flag which indicates the render style by default each declaration is given its own file to increase navigation via the sidebar.
	 */
	//renderStyle: 'source' | 'declaration' for MVP just handle by source as it has the least amount of extra logic
}