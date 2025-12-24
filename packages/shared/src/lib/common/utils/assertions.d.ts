export declare function assertEqual<T>(actual: T, expected: T, fieldName1: string, fieldName2: string): asserts actual is T;
export declare function assertNotNullOrUndefined<T>(value: T | null | undefined, fieldName: string): asserts value is T;
export declare function assertNotEqual<T>(value1: T, value2: T, fieldName1: string, fieldName2: string): void;
export declare const isNotUndefined: <T>(value: T | undefined) => value is T;
export declare function assertNull<T>(value: T | null, fieldName: string): asserts value is T;
export declare function asserNotEmpty<T>(value: T[] | null | undefined, fieldName: string): asserts value is T[];
