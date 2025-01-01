import { join } from "path";
import { Project } from "ts-morph"
import { render } from "./renderer";

const TEST_DIR = join(__dirname, 'tests');

/**
 * With the traversal method being controlled by the renderer and a wide range of node types to be utilized to fully test all the corner cases. So as of right now the renderrer test will act as a sort of defacto method to test signatures and tools. 
 * 
 * I consider this a flaw in design as I should have designed each component to be testable and utilizable without one another. I may build out a traversal tool which will reduce the logic of the renderer significantly... well will move the logic to another file. That being said it would allow me to traverse a file and run specific action rather then relying upon a renderer which will do a lot more then just test the desired use case in a single pass. 
 * @todo - Create a succinct method of node emulation or implementation such that tests can be written for specific use cases.
 */
describe(`Test the renderer and subsequently the corner cases for signature`, () => {
	const project = new Project();
	beforeAll(()=>{
		project.addSourceFilesAtPaths(join(TEST_DIR, "**/*.ts"));
	})

	test(`Test the renderer on the primitives file`, ()=>{
		const src = project.getSourceFileOrThrow(join(TEST_DIR, "primitives.ts"));
		const rendered = render("Primitives", src);
		console.log(rendered?.length);
	})
})