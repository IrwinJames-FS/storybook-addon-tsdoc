import TS from "./TS";


let ran = false;
export default function(config: {stories:string[]} & Record<string, any>){
	
	//TODO add in configuration support
	//const {stories = []} = config;
	const storyPath = `${TS.docs}/**/*.mdx`;
	TS.warn(storyPath);
	//stories.push(storyPath);
	//config.stories = stories;
	if(!ran){
		TS.document();
		ran = true;
		return {stories: [storyPath]};
	} 
	return {stories: [storyPath]};
}