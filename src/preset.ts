import { minimatch } from "minimatch";
import { STORY_BOOK_BLOCK } from "./constants";
import TS from "./TS";
import { TSDocOptions } from "./types";
import type { InlineConfig } from "vite";
import type { Configuration } from "webpack";
import { join } from "path";
const MOD_ROUTE = ".storybook/virtual:test-module.mdx";
const VAL_ROUTE = "\0"+MOD_ROUTE

let ran = false;
export default {
	stories: (entries: unknown[] = [], options: TSDocOptions)=>{
		if(!ran){ //there should be a better way to handle this.
			TS.document(options);
			ran = true;
		}
		return [...entries, TS.docsGlob]
	},
	viteFinal: (config: InlineConfig) => {
		TS.log("Loading Vite Plugin", config.plugins?.length ?? -1);
		config.plugins?.push({
			name: 'vite-plugin-storybook-addon-tsdoc',
			handleHotUpdate(ctx) {
				const e = join(process.cwd(), TS.entry)
				const match = minimatch(ctx.file, e);
				TS.log("Handle update", ctx.file, e, match);
				//for now just rebuild docs
				
				if(match){
					TS.document();
					return [];
				}
				
			},
		})
		return config;
	},
	webpackFinal: (config: Configuration) => {
		TS.log("Loading webpack plugin");
		return config;
	}
}
/*
export const webpack = async (config: Configuration) => {
	TS.log("Registering webpack plugin");
	return config
} 
export const babelDefault = async (config: unknown) => {
	TS.log("Registering babel plugin");
	return config;
}
export const viteFinal = async (config: InlineConfig) => {
	TS.log("Registering plugin");
	const plugins = config.plugins ?? [];
	plugins.push({
		name: 'storybook-addon-tsdoc-vite-plugin',
		resolveId(id) {
			TS.log("Resolving a virtual module", id);
			if(id === MOD_ROUTE){
				
				return VAL_ROUTE
			}
		},
		load(id, options) {
			TS.log("Loading virtual module", id);
			if(id === VAL_ROUTE){
				return `${STORY_BOOK_BLOCK}
				<Meta title="test/test"/>
				
				# Hello World`;
			}
		},
	})
	config.plugins = plugins; //just incase none existed.
	return config;
}

*/
/**
 * registers using a typical callback function this is called once for the the manager and again for the preview plugins. 
 * 
 */
function test(config: {stories:string[]} & Record<string, any>, options: Partial<TSDocOptions>){
	//TODO add in configuration support
	const storyPath = `${TS.docs}/**/*.mdx`;
	if(!ran){
		TS.document();
		ran = true;
		return {stories: [storyPath, "../virtual:**/*.mdx", "../virtual:test-module.mdx"]};
	} 
	return {stories: [storyPath, "virtual:**/*.mdx", "virtual:test-module.mdx"]};
}