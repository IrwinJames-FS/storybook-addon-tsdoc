export const $kind = (kind:string)=>`<span className="ts-doc-kind">${kind}</span>`;

export const $type = (type: string) => `<span className="ts-doc-type">${type}</span>`;

export const $literal = (lit: string) => `<span className="ts-doc-lit">${lit}</span>`;

export const $href = (text: string, href:string) => `[${text}](${href})`;

export const $name = (text: string) => `<span className="ts-doc-name">${text}</span>`;