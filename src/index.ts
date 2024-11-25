import TS from "./TS";

let ran = false;
export default function(config: {stories:string[]} & Record<string, any>){
	//TODO add in configuration support
	const {stories = []} = config;
	stories.push(`../${TS.docs}/**/*.mdx`);
	config.stories = stories;
	TS.log(config.stories);
	if(!ran){
		ran = true;
		return config;
	} 
	
	
	
	TS.document();
	
	return config;
}