# storybook-addon-tsdoc

This is a simple addon that generates documentation using a typescript->jsdoc->inference strategy to build out a type my. 

Currently hmr does not work it is a priority.

## Examples

```ts
const config = {
	//...
	addons: [
		//...
		"storybook-addon-tsdoc" //generates documentation for all .ts files (except for those containing .test and .stories)
	],
}
```

**Advanced configuration**

```ts
const config = {
	//...
	addons: [
		//...
		{
			name:"storybook-addon-tsdoc",
			options: {
				out: 'docs',
				entries: ['src/**/!(*.test|*.stories).ts', 'code/**/!(*.test|*.stories).ts'],
				renderStyle: 'file'
			}
		}
	],
}
```

## options.out:

Changes the output directory relative to the nearest package.json

## options.entries:

An array of glob patterns used to select project files.



