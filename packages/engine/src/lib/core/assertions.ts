import { AssertionError } from '../helper/execution-errors'

export function assertEngineNotNullOrUndefined<T>(
    value: T | null | undefined,
    fieldName: string,
): asserts value is T {
    if (value === null || value === undefined) {
        throw new AssertionError(fieldName)
    }
}