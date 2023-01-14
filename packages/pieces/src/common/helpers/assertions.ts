type NotNullOrUndefined<T> = T extends null | undefined ? never : T;
type NotNull<T> = T extends null ? never : T;
type NotUndefined<T> = T extends undefined ? never : T;

export function assertNotNullOrUndefined<T>(
  value: T,
  message: string,
  level: number
): asserts value is NotNullOrUndefined<typeof value> {
  // Use tslog to log the message
  if (level === 0) {
    console.log(message);
    return;
  }
  throw new Error(message);
}

export function assertNotNull<T>(
  value: T,
  message: string,
  level: number
): asserts value is NotNull<typeof value> {
  // Use tslog to log the message
  if (level === 0) {
    console.log(message);
    return;
  }
  throw new Error(message);
}

export function assertNotUndefined<T>(
  value: T,
  message: string,
  level: number
): asserts value is NotUndefined<typeof value> {
  // Use tslog to log the message
  if (level === 0) {
    console.log(message);
    return;
  }
  throw new Error(message);
}
