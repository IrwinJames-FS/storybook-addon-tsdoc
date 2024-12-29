import { Node, Project, SourceFile } from "ts-morph"
import { bySyntax } from "./SyntaxKindDelegator";
import SK from "./SyntaxKindDelegator.types";

describe(`Test the bySyntax delegator`, () => {
	test(`Test a basic statement`, ()=>{
		const src = new Project().createSourceFile('', '');
		const src2 = new Project().createSourceFile('', '');
		const src3 = new Project().createSourceFile('', '');
		const src4 = new Project().createSourceFile('','');
		src2.getKind = ()=>1337 as SK; //force an unused kind 
		src3.getKind = ()=>SK.VariableDeclaration;
		src4.getKind = ()=>1338 as SK;
		const val = bySyntax(src, {
			[SK.SourceFile]: node=>{
				expect(node.getKind()).toBe(SK.SourceFile);
			},
		}, n=>console.log("No support", n?.getKindName()))
		bySyntax(src2, {}, n=>expect(n?.getKind()).toBe(1337));
		bySyntax(src4, {}, n=>expect(n?.getKind()).toBe(1338));
		const val3 = bySyntax(undefined, {}, n=>expect(n).toBeUndefined());
		const val4 = bySyntax(src, {}, n=>expect(n?.getKind()).toBe(SK.SourceFile))
		const val5 = bySyntax(src3, {
			[SK.VariableDeclaration]: node=>expect(Node.isVariableDeclaration(node)).toBeTruthy()
		}, n=>expect(n?.getKind()).toBe(SK.VariableDeclaration))
	})
})