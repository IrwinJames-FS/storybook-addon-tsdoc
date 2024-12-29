import { join } from "path";
import { Node, Project } from "ts-morph"
import { getSignature } from "./node-signature";
const TEST_FILES = join(__dirname, "tests");
const PRIMITIVE_FILE = join(TEST_FILES, "primitives.ts")
describe(`Test the signature methods`, ()=>{
	const project = new Project();
	beforeAll(()=>{
		project.addSourceFilesAtPaths(join(TEST_FILES, "**/*.ts"));
	});

	test(`Test the primitives`, ()=>{
		//test all declarations in the primitives syntax list.
		const src = project.getSourceFile(PRIMITIVE_FILE)!;
		const sigs = [
			`<span className="ts-doc-lit">&quot;Hello, World&quot;</span>`,
			`<span className="ts-doc-lit">1e3</span>`,
			`<span className="ts-doc-lit">true</span>`,
			`<span className="ts-doc-lit">false</span>`,
			`<span className="ts-doc-type">string</span>`,
			`: <span className="ts-doc-lit">"Hello, World"</span>`,
			`: <span className="ts-doc-type">string</span>`,
			`: <span className="ts-doc-type">number</span>`,
			`[<span className="ts-doc-lit">&quot;Hello, World&quot;</span>]`,
			`<span className="ts-doc-lit">&lcub;...&rcub;</span>`,
			`() =&gt; <span className="ts-doc-lit">void</span>`,
			`<span className="ts-doc-kind">class</span> extends <span className="ts-doc-type">Array</span>&lt;<span className="ts-doc-type">number</span>&gt;&lcub;...&rcub;`,
			` extends <span className="ts-doc-type">Array</span>&lt;<span className="ts-doc-type">number</span>&gt;`
		]
		let i = 0;
		for(const node of src.getChildSyntaxList()?.getChildren().flatMap(n=>Node.isVariableStatement(n) ? n.getDeclarations():Node.isClassDeclaration(n) ? [n, ...n.getMembers()]:[n]) ?? []){
			const sig = getSignature(node);
			if(i >= sigs.length) console.log(sig, node.getKindName());
			expect(sig).toBe(sigs[i]);
			i++;
		}
	})
})