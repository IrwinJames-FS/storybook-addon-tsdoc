export const GREETING = "Hello, World";

export const MAX_DISTANCE = 1e3;

export const BOOLEAN_TRUE = true;

export const BOOLEAN_FALSE = false;

export const GREETING_AS_STRING: string = GREETING;

export type StringLiteralType = "Hello, World";

export type StringType = string;

export type NumberType = number;

export const ArrayLiteral = ["Hello, World"];

export const ObjectLiteral = {
	name: "Jimmy",
	age: 33,
	isMale: true
}

export const functionVariable = ()=>["Hello, World"]

export const classVariable = class extends Array<number> {
}

export class Geo extends Array<number> {
	get x(){ return this[0];}
	set y(v:number){ this[0] = v;}
}



