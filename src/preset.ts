import TS from "./TS";
import { TSDocOptions } from "./types";


let ran = false;
/**
 * registers using a typical callback function this is called once for the the manager and again for the preview plugins. 
 * 
 */
export default function(config: {stories:string[]} & Record<string, any>, options: Partial<TSDocOptions>){
	//TODO add in configuration support
	const storyPath = `${TS.docs}/**/*.mdx`;
	if(!ran){
		TS.document();
		ran = true;
		return {stories: [storyPath]};
	} 
	return {stories: [storyPath]};
}