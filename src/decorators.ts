import { Node } from "ts-morph";
import { getFullName } from "./node-tools";
import { Nodely } from "./types";

/*
Decorators are just a mechanism to color code different parts of the syntax. 
*/

/**
 * Creates a kind decorator
 * @param kind 
 * @returns 
 */
export const $kind = (kind:string)=>`<span className="ts-doc-kind">${kind}</span>`;

/**
 * Creates a type decorator
 * @param type 
 * @returns 
 */
export const $type = (type: string) => `<span className="ts-doc-type">${type}</span>`;

/**
 * Creates a literal decorator
 * @param lit 
 * @returns 
 */
export const $literal = (lit: string) => `<span className="ts-doc-lit">${lit}</span>`;

/**
 * Creates a link to a reference.
 * @param text 
 * @param href 
 * @returns 
 */
export const $href = (text: string, href:string) => `[${text}](${href})`;

/**
 * Creates a name decorator
 * @param text 
 * @returns 
 */
export const $name = (text: string) => `<span className="ts-doc-name">${text}</span>`;

/**
 * Because types are often just a string a template string array is a convenience. 
 * @param strings 
 * @param args 
 * @returns 
 */
export const $kd = (strings: TemplateStringsArray, ...args: unknown[]) => $kind(strings.reduce((o, s, i)=>o+s+(args[i] ?? ''), ''));

export type Headings =  1 | 2 | 3 | 4 | 5 | 6;
/**
 * Create a title section that allows for a more dynamic naming then what .mdx typically supports. 
 * 
 * This is accomplished by visibly hiding the default header and positioning a new header elements over the original header. this will replicate the scroll effect while allowing a more descriptive title.  
 * @param s 
 * @param node 
 * @param content 
 * @returns 
 */
export const $h = (
	s: Headings,
	node: Nodely,
	...content: unknown[]) => `<div className="ts-doc-header-wrapper">

<h${s} className="ts-doc-header">${content.join(' ')}</h${s}>

${ node ? `${'#'.repeat(s)} ${getFullName(node)}\n\n`:''}</div>`;

export const $section = (...content:string[]) => {
	const ctn = content.filter(c=>c.trim()).join('\n');
	if(!ctn) return '';
	return `<div className="ts-doc-section">
		${ctn}
	</div>`
}