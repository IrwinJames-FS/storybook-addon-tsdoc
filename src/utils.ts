export const pick = <
	T extends {},
	K extends keyof T
>(obj:T, ...keys: K[]): Pick<T, K>=>keys.reduce((o,v)=>({...o, [v]:obj[v]}), {} as Pick<T, K>)

