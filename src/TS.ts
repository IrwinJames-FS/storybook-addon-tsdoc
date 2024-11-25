import { blueBright } from "console-log-colors";
import { Project } from "ts-morph";

/**
 * This will be resposible for being a hub for the configuration
 */
class TS {
	static docs: string = ".tsdoc"
	static log(...args: unknown[]){ return console.log(blueBright("TSDOC:"), ...args)}
	
	static document(){
		const project = new Project
	}
}
export default TS;