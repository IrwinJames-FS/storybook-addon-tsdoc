import { blueBright, cyan, gray } from "console-log-colors";
import { Node, Project, SourceFile } from "ts-morph";
import { existsSync, rmSync, mkdirSync, writeFileSync } from "fs";
import type { Declaration, Nameable } from "./types";
import { isAbsolute, join } from "path";
import { minimatch } from "minimatch";
import { getDocPath, getFullName, getType } from "./node-tools";
import defaultRenderers, { RenderMap } from "./renderers";
/**
 * This will be resposible for being a hub for the configuration
 */
class TS {
	/**
	 * A list of names that can be replaced.
	 * 
	 * this uses a simple find and replace method in the order they are declared for instance if you src aliased to source but then src/bin aliased to bin the second pattern would never occur because src was already replaced.
	 */
	static aliases:[string | RegExp, string][] = [
		["src/", ""], //by default the src prefix will be dropped
	]

	static _renderers: RenderMap = defaultRenderers

	/**
	 * Setting values on the renderer only replaces components but does not delete non conclicting renderers
	 */
	static get renderers():RenderMap{ return TS._renderers; }
	static set renderers(value:RenderMap){
		for(const key in value){
			TS._renderers[key] = value[key];
		}
	}
	static _docs: string = ".tsdoc"

	static docPath: string = join(process.cwd(),".tsdoc");
	/**
	 * The directory relative to package.json to build the documentation in
	 */
	static get docs():string {
		return TS._docs;
	}

	static set docs(value: string){
		if(isAbsolute(value)){
			if(!value.startsWith(process.cwd())) throw new Error("Unable to generate documents outside the current project");
			if(/\.[0-9A-Z]\/?$/gi.test(value)) console.warn("Path appears to be a file");
			TS._docs = value.slice(process.cwd().length+1); //drop the absolute path
			TS.docPath = value;
			return;
		}
		TS._docs = value;
		TS.docPath = join(process.cwd(), value);
	}

	/**
	 * The paths which should be documented. this supports glob patterns.
	 */
	static entries: string[] = ['src/**/!(*.test|*.stories).ts']

	static cwd = process.cwd(); //this automatically climbs to project root no need to do so myself. 
	/**
	 * Just a styled console log
	 * @param args 
	 * @returns 
	 */
	static log(...args: unknown[]){ 
		console.log(blueBright("TSDOC:"), ...args);
		return undefined;
	}
	
	/**
	 * Document the project
	 */
	static document(){
		const docsdir = join(TS.cwd, TS.docs);
		if(existsSync(docsdir)) rmSync(docsdir, {recursive: true});
		mkdirSync(docsdir);
		const project = new Project();
		project.addSourceFilesAtPaths(TS.entries);
		const sources = project.getSourceFiles();
		TS.log(cyan("Documenting"), gray(sources.length+` file${sources.length === 1 ? '':'s'}`));

		for(const source of sources){
			this.documentSource(source);
		}
	}

	static documentSource(source: SourceFile){
		const syntaxList = source.getChildSyntaxList();
		if(!syntaxList) return;
		const nodes = syntaxList.getChildren().flatMap(TS.documentNode)
		TS.log(`Found ${nodes.length} declarations`);
		for(const node of nodes){
			if(!node.docPath) continue;
			const content = TS.renderers.renderFile(node);
			if(!content) continue;
			writeFileSync(node.docPath, content);
		}
	}

	static documentNode(node: Node):Declaration[]{
		
		const docPath = getDocPath(node);
		const name = getFullName(node);
		if(!docPath || !name){
			return [];
		}

		//just drop the prefix for the title
		return [{
			title: docPath.slice(TS.docPath.length+1, -4).replace(/-/g,'/'),
			name,
			kind: node.getKindName(),
			docPath: docPath,
			type: getType(node),
			node
		}]
	}
}
export default TS;