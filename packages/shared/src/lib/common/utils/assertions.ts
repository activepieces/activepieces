export function assertEqual<T>(
    actual: T,
    expected: T,
    fieldName1: string,
    fieldName2: string,
    
): asserts actual is T {
    if (actual !== expected) {
        throw new Error(`${fieldName1} and ${fieldName2} should be equal`)
    }
}

export function assertNotNullOrUndefined<T>(
    value: T | null | undefined,
    fieldName: string,
): asserts value is T {
    if (value === null || value === undefined) {
        throw new Error(`${fieldName} is null or undefined`)
    }
}

export function assertNotEqual<T>(
    value1: T,
    value2: T,
    fieldName1: string,
    fieldName2: string,
): void {
    if (value1 === value2) {
        throw new Error(`${fieldName1} and ${fieldName2} should not be equal`)
    }
}


export const isNotUndefined = <T>(value: T | undefined): value is T => {
    return value !== undefined
}
