import TS from "./TS";


let ran = false;
export default function(config: {stories:string[]} & Record<string, any>){
	
	//TODO add in configuration support
	//const {stories = []} = config;
	const storyPath = `${TS.docs}/**/*.mdx`;
	TS.warn(storyPath);
	//stories.push(storyPath);
	//config.stories = stories;
	TS.document();
	if(!ran){
		ran = true;
		return {stories: [storyPath]};
	} 
	return {stories: [storyPath]};
}