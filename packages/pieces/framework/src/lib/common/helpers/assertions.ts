export function assertNotNullOrUndefined<T>(
  value: T | null | undefined,
  fieldName: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`${fieldName} is null or undefined`);
  }
}

export const isNotUndefined = <T>(value: T | undefined): value is T => {
  return value !== undefined;
}
