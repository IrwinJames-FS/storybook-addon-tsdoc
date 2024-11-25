import TS from "./TS";

let ran = false;
export default function(config: Record<string, any>){
	if(ran) return config;;
	//TODO add in configuration support

	ran = true;
	return config;
}