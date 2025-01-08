import TS from "./TS";
import { TSDocOptions } from "./types";



export default {
	stories: (entries: unknown[] = [], options: TSDocOptions)=>{
		TS.watch();
		if(TS.hasUpdates) TS.document(options);
		return [...entries, TS.docsGlob];
	}
};