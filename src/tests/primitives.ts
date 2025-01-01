/*
Test Basic primitive types and constants including a type reference and Literal declarations.

Might as well test enum declarations and literals here as well.
*/


export type STRING_TYPE = string;
export type NUMBER_TYPE = number;
export type BOOLEAN_TYPE = boolean;
export type DATE_TYPE = Date;
export type ARRAY_TYPE = Array<number>;
export type POINT_TYPE = [x:number, y:number];
export type STATE_TYPE = [string, (value:string)=>void];
export type FUNCTION_STRING_RETURN_TYPE = ()=>string;
export type STRING_LITERAL = "Hello World";
export type NUMBER_LITERAL = 0x1;
export type TRUE_LITERAL = true;
export type FALSE_LITERAL = false;
export type OPTIONAL<T> = T | undefined;
export type UNION_TYPE = string | number | undefined | void;
export type INTERSECTION_TYPE = {
	type: 0x1,
	value: string
} & {
	name: string
}
export type USER = {
	firstName: string,
	lastName: string,
	memberSince: Date,
	isActive?: boolean,
	address: {
		street: string,
		city: string,
		state: string
		zip: string
	}
}
export enum SKLite {
	variable = 0,
	typeAlias,
	enum,
}

export const STRING_CONST = "Hello Universe";

export const CIRCLE = Math.PI*2;

export const getRadius = () => new Date().getMilliseconds();

export const USER_OBJ = {
	name: "James Irwin"
}

export const ARRAY_LITERAL_CONSTANT = ["Hello", "to", "all"]

export const ARRAY_CONSTANT = ARRAY_LITERAL_CONSTANT.map(s=>s.toLowerCase());

export const TYPED_ARRAY_CONSTANT: string[] = ARRAY_LITERAL_CONSTANT;
export class Geometry<T> extends Array<T> {
	get foo(){
		return "Bar";
	}
	constructor(...values: T[]){
		super(...values);
	}

	angle = 72;

	getNewAngle(){
		return Math.floor(Math.random()*360);
	}
}

export const Geo = class extends Array<number> {};

export function plot(x: number, y: number){
	console.log(x,y);
}



