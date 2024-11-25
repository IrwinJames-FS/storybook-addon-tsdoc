import TS from "./TS";
import { Declaration } from "./types"





export const joinArgs = (content: unknown[], delim: string = ' ') => content.filter(c=>!!c).join(delim)

//For now I am just using markdown notation however this will cause complex titles to break link to systems in storybook. 
export const $h = (...content: unknown[]) => joinArgs(['##', ...content]);

export type DocRenderFN = (...declarations: Declaration[]) => string
export type RenderMap = Record<string, DocRenderFN>

/**
 * The default renderers are just a list of componens
 * 
 * It is important to note that all declared components are expected for complex components to work however at some point an integration for different rendering schemes will be added
 */
const defaultRenderers: RenderMap = {
	renderFile: (...nodes:Declaration[])=>nodes.length ? `import { Meta } from "@storybook/blocks";

<Meta title="${nodes[0].title}"/>

${nodes.map(n=>TS.renderers.render(n))}`:'',
	render: ({name, type}) => `${$h(name, type ? ':':'', type)}`
}

export default defaultRenderers;
