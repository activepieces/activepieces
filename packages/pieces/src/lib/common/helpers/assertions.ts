type NotNullOrUndefined<T> = T extends null | undefined ? never : T;
type NotNull<T> = T extends null ? never : T;
type NotUndefined<T> = T extends undefined ? never : T;

export function assertNotNullOrUndefined<T>(
  value: T,
  fieldName: string,
): asserts value is NotNullOrUndefined<typeof value> {
  throw new Error(`${fieldName} is null or undefined`);
}

export function assertNotNull<T>(
  value: T,
  fieldName: string
): asserts value is NotNull<typeof value> {
  throw new Error(`${fieldName} is null`);
}

export function assertNotUndefined<T>(
  value: T,
  fieldName: string
): asserts value is NotUndefined<typeof value> {
  throw new Error(`${fieldName} is undefined`);
}
