import { isAbsolute, join } from "path";
import { blueBright, cyan, green, red, yellow } from "console-log-colors";
import { Project, SourceFile, } from "ts-morph";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { TSDocOptions } from "./types";
import { minimatch } from "minimatch";
import { render } from "./renderer";
import './utils'; //adds the wrap function to strng prototype.
/**
 * TS is a central repository for options. This will also handle code compiling based off a tsconfig
 */
export default class TS {
	/**
	 * The document folder path
	 */
	static docs: string = join(process.cwd(), ".tsdoc");

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
	 * Resolves to a storybook url path value.
	 * @param url 
	 * @returns {string}
	 */
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
		project.addSourceFilesAtPaths(join(process.cwd(),this.entry));
		project.getSourceFiles().forEach(f=>{
			const match = minimatch(f.getFilePath(), join(process.cwd(),this.entry));
			if(!match) project.removeSourceFile(f)
		});
		TS.log(cyan("Documenting"), join(process.cwd(), TS.entry), red(project.getSourceFiles().length), `file${project.getSourceFiles().length === 1 ? '':'s'}`);
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