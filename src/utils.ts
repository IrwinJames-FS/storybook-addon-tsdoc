const HTML_CHARS: Record<string, string> = {
	"&":"&amp;",
	"<":"&lt;",
	">":"&gt;",
	'"':"&quot;",
	"'":"&#039;",
	"{":"&lcub;",
	"}":"&rcub;"
}

const ESC_REG = /[&<>"'\{\}]/g;

/**
 * The escape method should be used sparingly. because for example it can over escape a string if already escaped one. that being said this function should be unecessary once addon full supports the spec.
 * @param text 
 */
export const escape = (text:string)=>{
	return text.replace(ESC_REG, match=>HTML_CHARS[match]);
}

declare global {
	interface String {
		wrap(a: string, b:string):string
	}
}

if (!String.prototype.wrap) {
	String.prototype.wrap = function(a: string='', b: string=''){
		if(!this.toString().trim()) return '';
		a = escape(a);
		b = escape(b);
		return `${a}${this}${b}`; //this should already be escaped
	}
}