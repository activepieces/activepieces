export declare function isString(str: unknown): str is string;
export declare function isNil<T>(value: T | null | undefined): value is null | undefined;
export declare function setAtPath<T, K extends keyof any>(obj: T, path: K | K[], value: any): void;
export declare function insertAt<T>(array: T[], index: number, item: T): T[];
export declare function debounce<T>(func: (...args: T[]) => void, wait: number): (key?: string, ...args: T[]) => void;
type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends Record<string, unknown> ? DeepPartial<T[P]> : T[P];
};
/**
 * This function also merges arrays, x = [1, 2], y = [3, 4], z = deepMergeAndCast(x, y) -> [1, 2, 3, 4]
**/
export declare function deepMergeAndCast<T>(target: DeepPartial<T>, source: DeepPartial<T>): T;
export declare function kebabCase(str: string): string;
export declare function isEmpty<T>(value: T | null | undefined): boolean;
export declare function startCase(str: string): string;
export declare function camelCase(str: string): string;
export declare function parseToJsonIfPossible(str: unknown): unknown;
export declare function pickBy<T extends Record<string, unknown>>(object: T, predicate: (value: T[keyof T], key: keyof T) => boolean): Partial<T>;
export declare function chunk<T>(records: T[], size: number): T[][];
export declare function partition<T>(array: T[], predicate: (item: T, index: number, arr: T[]) => boolean): [T[], T[]];
export declare function unique<T>(array: T[]): T[];
export {};
