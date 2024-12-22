import TS from "./TS";
import { TSDocOptions } from "./types";


let ran = false;
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