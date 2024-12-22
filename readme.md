# storybook-addon-tsdoc

This addon is an attempt to add some additional documentation generation for non component based typescript. 

## Getting started

1. Install the addon

```bash
npm install @irwinproject/storybook-addon-tsdoc
```

2. Add the addon to .storybook/main.ts

```ts

const config: StorybookConfig = {
  //..
  addons: [
    //...
    "@irwinproject/storybook-addon-tsdoc"
  ],
};
```

Thats it... By default the addon makes a few assumptions. 

1. the **/.storybook** directory is located in the root directory of the project
2. the **tsconfig.json** for the project is in the same directory as **/.storybook**.
	
	The addon uses your tsconfig primarily to resolve any custom path aliases. TS-Morph also uses the config replicate settings during compilation. 
3. The code to be documented is located in the **/src** folder
4. Only files ending in **.ts** should be documented.

## Configuring

you can configure the addon to work with most projects. 

```ts
const config: StorybookConfig = {
  //..
  addons: [
    //...
    {
		name:"@irwinproject/storybook-addon-tsdoc",
		options: {
			//Relative use cwd to resolve.
			tsconfig: "tsconfig.json", 
			docs: ".tsdoc",
			tsconfig: "tsconfig",
			/*
			entry supports glob patterns 
			*/
			entry: "src/**/!(*.test|*.stories|*.d).ts",
			/*By default the docs directory specified above will be deleted and rebuilt. 
			However if you have other files not generated by this addon in said folder you can disable this feature by setting this value to false.
			*/
			shouldClearDocsOnStart: true,

			//Colors

			/*
			Each documented entity has a type representation provided (var, let, const, function, method, class, property, ...)
			This value lets you set this color
			*/
			kindColor: "#F08",

			/*
				The color used to represent native types.
			*/
			typeColor: "rgb(28,128,248)",

			/*
			the color for types that reference to an internal non native type. 
			*/
			refColor: "rgb(0,100,220)",

			/*
			the color used to represent literal types.
			*/
			litColor: "rgb(248, 28, 28)",

			/*
			the color used for named components like arguments or properties.
			*/
			nameColor: "rgb(248, 128, 28)"
		}
	}
  ],
};
```

## Limitations

1. Currently **storybook-addon-tsdoc** only supports a single entry point. 
	* I am exploring methods to build documentation and prevent name collisions for now a glob pattern can be used to encapsulate multiple entry points if necessary. 

2. **/src** file is aliased to '' when building documentation structure. 
	* I am exploring adding an alias system similar to path aliases to allow for the documentation paths to better reflect the production file structure rather then the development structure.
3. Documentation is generated per file.
	* I am exploring more of a per declaration structure similar to how JSDocs works however a concession was made to reach my goal. maybe next release I will add this.
4. No HMR support.
	* Updating existing files does not appear to be problematic however I have been unable to find a way to register new files with storybooks mdx parser.
	* While looking into this issue I found that Storybooks docs addon uses virtual files while in dev mode. I would like to research this further to see if I could take advantage of the same behaviors.
5. Lacks tag support.
	* It occured to me toward the end of the production process that it might be more beneficial to find files based on tags in a .stories.tsx file in some situations. While I am not sure I will be building out support for this behavior it is something I am considering. 
6. Shallow type parsing
	* ```ts
		const SOMEVALUE: number = 10; //number
		const SOMEVALUE = 10; //evaluates to the type literal 10.
		const SOMEVALUE = "1".charCodeAt(0); //number
		const CIRCLE = Math.PI * 2; // PI*2
		```
	* This becomes more evident when documenting functions as return types are not provided as a CallExpression when no return type is specified
	```ts
		function distance(x1: number, y1: number, x2: number, y2: number){
			return //find distance
		}

		/*
		evaluates as 
		(x1: number, y1: number, x2: number, y2: number) => void
		*/

		function distance(x1: number, y1: number, x2: number, y2: number): number{
			return //find distance
		}
		/*
		evaluates as 
		(x1: number, y1: number, x2: number, y2: number) => number
		*/
	```
	I do plan on addressing this as I build a type infer method. 

	## Feature Requests.

	While I tried to test a range of use cases There may be patterns which are not properly handled or represented. If you find any such instances please submit an issue with the following information.
	1. an example of the code that is being parsed incorrectly.
	2. an explanation of how it should be represented or how its being represented incorrectly. 
		(I cannot promise I will represent a pattern or declaration in your preferred manner however I will try to use existing accepted representations.)
	3. the version of the addon you are utilizing. 

	I welcome requests for additional features and as I have time to update the addon I will. 