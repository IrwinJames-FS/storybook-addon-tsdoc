import path, { isAbsolute, join } from "path";
import { blueBright, cyan, green, red, yellow } from "console-log-colors";
import { Node, Project, SourceFile, } from "ts-morph";
import { cpSync, existsSync, FSWatcher, mkdirSync, rmSync, watch, writeFileSync } from "fs";
import { TSDocOptions } from "./types";
import { minimatch } from "minimatch";
import { render } from "./renderer";
import './utils'; //adds the wrap function to strng prototype.
import { getFullName } from "./node-tools";
import { documentDeclaration, documentDeclarations } from "./renderDeclarations";
import { STORY_BOOK_BLOCK } from "./constants";
import { traverse } from "./traverse";
/**
 * TS is a central repository for options. This will also handle code compiling based off a tsconfig
 */
export default class TS {
	static watcher?: FSWatcher
	static hasUpdates: boolean = true;
	/**
	 * The document folder path
	 */
	static docs: string = join(process.cwd(), ".tsdoc");

	/**
	 * Describes the glob used to identify tsdocs documentation.
	 */
	static get docsGlob(){
		return `${TS.docs}/**/*.mdx`
	}
	/**
	 * The tsconfig path
	 */
	static tsconfig: string = join(process.cwd(), "tsconfig.json");

	/**
	 * @todo change to accept multiple entries.
	 * @todo add automatic entry based on tsconfig
	 */
	static entry: string = "src/**/!(*.test|*.stories|*.d).ts"

	/**
	 * @todo add configurable option
	 */
	static aliases: [RegExp, string][] = [
		[/src\//, ''] //drop the src from the docpath
	]

	/**
	 * I hate this property
	 * @todo virtualize docs in dev environment.
	 */
	static shouldClearDocsOnStart: boolean = true

	/**
	 * @todo support not documenting private variables.
	 */
	static documentPrivate: boolean = false;

	/**
	 * Declaration based documentation is in development. IT DOES NOT YET WORK!!!
	 */
	static documentStyle: "declaration" | "file" = "declaration"

	/**
	 * Documents a project but catches the errors and outputs it with tsdocs prefix.
	 */
	static document({tsconfig, entry, docs, shouldClearDocsOnStart}: Partial<TSDocOptions>={}){

		//apply options if any are provided
		if(tsconfig) this.tsconfig = isAbsolute(tsconfig) ? tsconfig:join(process.cwd(),tsconfig);
		if(entry) this.entry = entry;
		if(docs) this.docs = isAbsolute(docs) ? docs:join(process.cwd(), docs);
		if(shouldClearDocsOnStart !== undefined) this.shouldClearDocsOnStart = shouldClearDocsOnStart;

		//update the options
		//clear the docs dir
		if(TS.shouldClearDocsOnStart){
			TS.log("Clearing documents", this.docs);
			if(existsSync(this.docs)) rmSync(this.docs, {recursive: true});
			mkdirSync(this.docs);
		} else {
			if(!existsSync(this.docs)) mkdirSync(this.docs);
		}
		//move the styles to the docs foler
		cpSync(join(__dirname, "style.css"), join(this.docs, "style.css"));

		try {
			this.documentProject(TS.documentStyle === "file" ? TS.documentSourceFile:TS.documentByDeclaration);
		} catch (e){
			TS.err(e);
		}
		TS.hasUpdates = false;
	}

	

	static watch(){
		if(TS.watcher) return;
		TS.watcher = watch(process.cwd(), {recursive: true})
		TS.watcher.on("change", (e, fileName)=>{
			if(!fileName) return;
			fileName = typeof fileName === 'string' ? fileName:fileName.toString('utf-8');
			if(!minimatch(fileName, TS.entry)) return;
			TS.document();
		})
	}

	/**
	 * 1 stange case I have encountered is when declarations are differenciated by case such as m and M in svg overwrite the file because file systems are not case specific. as such
	 * a record of all links will be tracked and if an overlap is detected a different path will be provided.
	 */
	static decs: Record<string, string> = {}
	/**
	 * Resolves the url to its path name that wil be used. for the path name and the path title
	 * @param url 
	 * @returns 
	 */
	static resolveUrl(url: string): string | undefined{
		if(!url.startsWith(process.cwd())) return;
		url = url.slice(process.cwd().length+1); //remove the root.
		if(!minimatch(url, TS.entry)) return;
		const u = TS.aliases.reduce((o,v)=>o.replace(...v), url);
		const nurl = TS.documentStyle === "declaration" ? u.replace(path.extname(u), ''):u;
		
		return TS.decs[nurl] ?? nurl;
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
	 * Resolves to a storybook url path value.
	 * @param url 
	 * @returns {string}
	 */
	static resolveDocPath(url: string): string{
		TS.log(TS.decs[url], url);
		const u = '/docs/'+(TS.decs[url] ?? url).replace(/[\/\.\(]/g, '-').replace(/[\)]/g, '');
		return (TS.decs[u] ?? u)+'--docs';;
	}

	/**
	 * Create a project (program) and crawl the parsed data.
	 */
	static documentProject(documentor: (node: SourceFile)=>void = TS.documentSourceFile){
		const project = new Project({
			tsConfigFilePath: this.tsconfig,
		});
		project.addSourceFilesAtPaths(join(process.cwd(),this.entry));
		project.getSourceFiles().forEach(f=>{
			const match = minimatch(f.getFilePath(), join(process.cwd(),this.entry));
			if(!match) project.removeSourceFile(f)
		});
		TS.log(cyan("Documenting"), join(process.cwd(), TS.entry), red(project.getSourceFiles().length), `file${project.getSourceFiles().length === 1 ? '':'s'}`);
		project.getSourceFiles().forEach(documentor);
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

	static documentByDeclaration(source: SourceFile) {
		documentDeclarations(source);
	}

	/**
	 * A prefixed log method to make identification easier
	 * @param args 
	 */
	static log(...args: unknown[]){
		console.log(blueBright("TsDoc"), ...args);
	}

	/**
	 * A red prefixed log method.
	 * @param args 
	 */
	static err(...args: unknown[]){
		console.log(red("TsDoc"), ...args);
	}

	/**
	 * A yellow prefixed log method.
	 * @param args 
	 */
	static warn(...args: unknown[]){
		console.log(yellow("TsDoc"), ...args);
	}

	/**
	 * A green prefixed log method. 
	 * @param args 
	 */
	static success(...args: unknown[]){
		console.log(green("TsDoc"), ...args);
	}
}