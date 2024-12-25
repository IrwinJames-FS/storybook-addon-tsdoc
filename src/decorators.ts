import { Node } from "ts-morph";
import { getFullName } from "./node-tools";
import { Nodely } from "./types";

export const $kind = (kind:string)=>`<span className="ts-doc-kind">${kind}</span>`;

export const $type = (type: string) => `<span className="ts-doc-type">${type}</span>`;

export const $literal = (lit: string) => `<span className="ts-doc-lit">${lit}</span>`;

export const $href = (text: string, href:string) => `[${text}](${href})`;

export const $name = (text: string) => `<span className="ts-doc-name">${text}</span>`;

export const $kd = (strings: TemplateStringsArray, ...args: unknown[]) => $kind(strings.reduce((o, s, i)=>o+s+(args[i] ?? ''), ''));

export type Headings =  1 | 2 | 3 | 4 | 5 | 6;
/**
 * Create a title section that allows for a more dynamic naming then what .mdx typically supports. 
 * @param s 
 * @param node 
 * @param content 
 * @returns 
 */
export const $h = (s: Headings,node: Nodely, ...content: unknown[]) => `<div className="ts-doc-header-wrapper">

<h${s} className="ts-doc-header">${content.join(' ')}</h${s}>

${ node ? `${'#'.repeat(s)} ${getFullName(node)}\n\n`:''}</div>`;

export const $section = (...content:string[]) => {
	const ctn = content.filter(c=>c.trim()).join('\n');
	if(!ctn) return '';
	return `<div className="ts-doc-section">
		${ctn}
	</div>`
}