import { Project, VariableStatement } from "ts-morph";
import { $h, $href, $kd, $kind, $literal, $name, $section, $type } from "./decorators"

describe(`Test each decorator method to ensure it works appropriately`, ()=>{
	test(`Test the $kind decorator`, ()=>{
		const kind = $kind('const')
		expect(kind).toBe(`<span className="ts-doc-kind">const</span>`)
	});
	
	test(`Test the $kd decorator, this is just a convenience as kinds are often statically typed.`, () => {
		const kind = $kd`const${'-test'}`;
		expect(kind).toBe(`<span className="ts-doc-kind">const-test</span>`)
	});

	test(`Test the $type decorator`, ()=>{
		const type = $type('string');
		expect(type).toBe(`<span className="ts-doc-type">string</span>`);
	});

	test(`Test the $literal decorator`, ()=>{
		const type = $literal('Hello, World');
		expect(type).toBe(`<span className="ts-doc-lit">Hello, World</span>`);
	});

	test(`Test the $literal decorator`, ()=>{
		const type = $name('value');
		expect(type).toBe(`<span className="ts-doc-name">value</span>`);
	});

	test(`Test the $href decorator`, ()=>{
		const type = $href('value', 'https://www.google.com')
		expect(type).toBe(`[value](https://www.google.com)`);
	});

	test(`Test the $h decorator`, ()=>{
		const src = new Project().createSourceFile('', 'const declaration = "Hello, World"');
		const node = (src.getChildSyntaxList()?.getFirstChild() as VariableStatement).getDeclarations()[0];
		const h1 = $h(1, node, 'value');
		const h2 = $h(2, undefined, 'value');
		expect(h1).toBe( `<div className="ts-doc-header-wrapper">

<h1 className="ts-doc-header">value</h1>

# declaration

</div>`);
	expect(h2).toBe( `<div className="ts-doc-header-wrapper">

<h1 className="ts-doc-header">value</h1>
	
</div>`);
	});

	test(`Test the $section decorator`, ()=>{
		const type = $section('value');
		const empty = $section('');
		expect(type).toBe(`<div className="ts-doc-section">
		value
	</div>`);
		expect(empty).toBe('');
	});
})