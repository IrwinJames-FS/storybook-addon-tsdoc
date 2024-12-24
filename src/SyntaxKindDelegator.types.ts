import { Node, SyntaxKind as SK } from "ts-morph";
import { Nodely } from "./types";
import { SyntaxKindTypeMap } from "./SyntaxKindMap";

/**
 * Each syntax kind we are utilizing has a validation method provided by ts-morph. luckily they all appear to utilize the same syntax
 * These validator along with checking for potential parse errors will coerce the generic Node type to a more accurate type.
 */
export type SyntaxKindValidator<T extends Node> = (node: Nodely) => node is T;

/**
 * Just a signature that allows a typed but open ended callback.
 */
export type SyntaxKindDelegateDefaultAction<T> = (node: Nodely)=>T;

/**
 * Every syntax kind can be provided this action which automatically types it. additionally if tiered support is necessary and you might encounter a null you can call the fallback callback.
 */
export type SyntaxKindDelegateAction<T extends Node, R> = (node: T, defaultFN: SyntaxKindDelegateDefaultAction<R>) => R
/**
 * For the delegator method to work it needs delegates which will know how to consume the generic Node and utilize it as a specialized node based on its syntax Kind. 
 * 
 */
export interface SyntaxKindDelegate<T extends Node> {
	validate: SyntaxKindValidator<T>
}

export type TypeByKind<T extends keyof SyntaxKindTypeMap> = SyntaxKindTypeMap[T]
export type SyntaxKindValidatorMap = {
	[k in keyof SyntaxKindTypeMap]: SyntaxKindValidator<SyntaxKindTypeMap[k]>
}

export type SyntaxKindMap<T> = {
	[k in keyof SyntaxKindTypeMap]: SyntaxKindDelegateAction<SyntaxKindTypeMap[k], T>
}

export type SKindMap<T> = Partial<SyntaxKindMap<T>>

export default SK; //this will make it easier to alias in other files later