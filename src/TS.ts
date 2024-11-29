import { isAbsolute, join } from "path";

import { blueBright, cyan, gray, green, red, yellow } from "console-log-colors";
import { Project, SourceFile, SyntaxList } from "ts-morph";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { TSDocOptions } from "./types";

import { minimatch } from "minimatch";
import { walk } from "./SKMap";
import { getSignature } from "./node-signature";



/**
 * TS is a central repository for options. This will also handle code compiling based off a tsconfig
 */
export default class TS {
	/**
	 * @todo add configurable option
	 * @todo add files to storybook in dev environment (builder api I think)
	 */
	static docs: string = join(process.cwd(), ".tsdoc");
	/**
	 * @todo add configurable option
	 */
	static tsconfig: string = join(process.cwd(), "tsconfig.json")
	/**
	 * @todo change to accept multiple entries.
	 * @todo add configurable option
	 * @todo add automatic entry based on tsconfig
	 */
	static entry: string = "src/**/!(*.test|*.stories|*.d).ts"

	static aliases: [RegExp, string][] = [
		[/src\//, ''] //drop the src from the docpath
	]

	static shouldClearDocsOnStart: boolean = true

	static renderStyle: 'source' | 'declaration' = 'declaration'; //not supported yet

	static kindColor = "#F08";
	static get style(){
		return `<style>
{\`
span{
	font-size: inherit;
}
.ts-doc-kind{
	color:${this.kindColor}
}
\`}
</style>`
	}
	/**
	 * Documents a project but catches the errors and outputs it with tsdocs prefix.
	 */
	static document({tsconfig, entry, docs, shouldClearDocsOnStart}: Partial<TSDocOptions>={}){

		//apply options if any are provided
		if(tsconfig) this.tsconfig = isAbsolute(tsconfig) ? tsconfig:join(process.cwd(),tsconfig);
		if(entry) this.entry = entry;
		if(docs) this.docs = isAbsolute(docs) ? docs:join(process.cwd(), docs);
		if(shouldClearDocsOnStart !== undefined) this.shouldClearDocsOnStart = shouldClearDocsOnStart;
		//if(renderStyle) this.renderStyle = renderStyle;


		//update the options
		//clear the docs dir
		if(TS.shouldClearDocsOnStart){
			TS.log("Clearing documents", this.docs);
			if(existsSync(this.docs)) rmSync(this.docs, {recursive: true});
			mkdirSync(this.docs);
		} else {
			if(!existsSync(this.docs)) mkdirSync(this.docs);
		}

		try {
			this.documentProject();
		} catch (e){
			TS.err(e);
		}
	}

	/**
	 * Resolves the url to its path name that wil be used. for the path name and the path title
	 * @param url 
	 * @returns 
	 */
	static resolveUrl(url: string): string | undefined{
		if(!url.startsWith(process.cwd())) return;
		url = url.slice(process.cwd().length+1); //remove the root.
		if(!minimatch(url, TS.entry)) return;
		return TS.aliases.reduce((o,v)=>o.replace(...v), url);
	}

	/**
	 * Resolves the url to a doc url
	 * 
	 * This should not be used on urls outside the entry path.
	 * @param url 
	 * @returns 
	 */
	static resolvedDocFilePath(url: string): string{
		return join(this.docs, url.replace(/\//g, '-')+'.mdx');
	}

	/**
	 * Create a project (program) and crawl the parsed data.
	 */
	static documentProject(){
		const project = new Project({
			tsConfigFilePath: this.tsconfig,
		});
		project.addSourceFilesAtPaths(this.entry);
		TS.log(cyan("Documenting"), red(project.getSourceFiles().length), `file${project.getSourceFiles().length === 1 ? '':'s'}`);
		project.getSourceFiles().forEach(this.documentSourceFile);
	} 

	/**
	 * Document the source file.
	 * 
	 * at this time this will create an mdx file if any nodes are traversed in said directory
	 * 
	 *
	 * @todo wrap style in style tag since it will never be used in any other way.
	 * @param source 
	 * @returns 
	 */
	static documentSourceFile(source: SourceFile){
		let data = ''
		for(const node of walk(source)){
			TS.success(node.getKindName());
			data += `## ${getSignature(node)}
`;
		}
		if(!data) return;
		const path = TS.resolveUrl(source.getFilePath())!;
		return writeFileSync(TS.resolvedDocFilePath(path), `import { Meta } from "@storybook/blocks";
		
<Meta title="${path}"/>

${data}

${TS.style}`);
	}

	static log(...args: unknown[]){
		console.log(blueBright("TsDoc"), ...args);
	}

	static err(...args: unknown[]){
		console.log(red("TsDoc"), ...args);
	}

	static warn(...args: unknown[]){
		console.log(yellow("TsDoc"), ...args);
	}

	static success(...args: unknown[]){
		console.log(green("TsDoc"), ...args);
	}
}