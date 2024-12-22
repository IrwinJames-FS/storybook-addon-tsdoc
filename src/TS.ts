import { isAbsolute, join } from "path";

import { blueBright, cyan, green, red, yellow } from "console-log-colors";
import { Project, SourceFile, } from "ts-morph";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { TSDocOptions } from "./types";

import { minimatch } from "minimatch";
import { render } from "./renderer";

declare global {
	interface String {
		wrap(a: string, b:string):string
	}
}

const HTML_CHARS: Record<string, string> = {
	"&":"&amp;",
	"<":"&lt;",
	">":"&gt;",
	'"':"&quot;",
	"'":"&#039;",
	"{":"&lcub;",
	"}":"&rcub;"
}
const ESC_REG = /[&<>"'\{\}]/g;
/**
 * This should be used to avoid errors with acorn... idealy it should be unecessary but for now will be used.
 * @param text 
 */
const escape = (text:string)=>{
	return text.replace(ESC_REG, match=>HTML_CHARS[match]);
}

String.prototype.wrap = function(a: string='', b: string=''){
	if(!this.toString()) return '';
	a = escape(a);
	b = escape(b);
	return `${a}${this}${b}`; //this should already be escaped
}
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
	static documentPrivate: boolean = false;
	static kindColor = "#F08";
	static typeColor = "rgb(28,128,248)";
	static refColor = "rgb(0,100,220)";
	static litColor = "rgb(248, 28, 28)";
	static nameColor = "rgb(248, 128, 28)";
	static get style(){
		return `<style>
{\`
.ts-doc-header-wrapper{
	position: relative;
}
h1:not(.ts-doc-header), h2:not(.ts-doc-header), h3:not(.ts-doc-header), h4:not(.ts-doc-header), h5:not(.ts-doc-header), h6:not(.ts-doc-header){
	height: 2px; /* hide without being hidden */
	padding: 0;
	margin: 0;
	font-size:0;
	border-bottom-width: 0px;
	position: absolute;
	background:#F00;
	top: calc(50% - 8px);
}

h2.ts-doc-header{
	font-size: 1.25rem;
}

h3.ts-doc-header{
	font-size: 1.2rem;
}

h4.ts-doc-header{
	font-size: 1.15rem;
}

h5.ts-doc-header{
	font-size: 1.1rem;
}

h6.ts-doc-header{
	font-size: 1.05rem;
}

.ts-doc-header {
	margin:1rem 0;
}
.ts-doc-header:hover + *>a:first-of-type>svg {
	visibility: visible;
}
.ts-doc-header span, .ts-doc-header a{
	font-size: inherit;
}
.ts-doc-kind{
	color:${this.kindColor}
}
.ts-doc-type{
	color:${this.typeColor}
}
.ts-doc-ref{
	color:${this.refColor}
}
.ts-doc-lit{
	color:${this.litColor}
}
.ts-doc-name{
	color:${this.nameColor}
}
.ts-doc-section{
	position: 'relative';
	padding-left: 1rem;
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

	static resolveDocPath(url: string): string{
		return '/docs/'+url.replace(/[\/\.]/g, '-')+'--docs';
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
		const path = TS.resolveUrl(source.getFilePath())!;
		if(!path) return;
		const data = render(path, source);
		if(!data) return;
		return writeFileSync(TS.resolvedDocFilePath(path), data);
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