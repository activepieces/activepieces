import { Effect, Option } from "effect"

class AssertionError extends Error {
  readonly _tag = "AssertionError"
  constructor(message: string) {
    super(message)
    this.name = "AssertionError"
  }
}

/**
 * Asserts value is not null/undefined. Returns the value or throws AssertionError.
 */
export const assertExists = <T>(
  value: T | null | undefined,
  message?: string
): T => {
  if (value === null || value === undefined) {
    throw new AssertionError(message ?? "Expected value to exist")
  }
  return value
}

/**
 * Type guard for non-nullish values.
 */
export const isExistent = <T>(value: T | null | undefined): value is T => value !== null && value !== undefined

/**
 * Asserts value is not null (but allows undefined). Returns the value or throws.
 */
export const assertNotNull = <T>(value: T | null, message?: string): T => {
  if (value === null) {
    throw new AssertionError(message ?? "Expected value to not be null")
  }
  return value
}

/**
 * Asserts array has exactly one element. Returns that element or throws.
 */
export const getOnlyOne = <T>(
  arr: ReadonlyArray<T>,
  message?: string | ((arr: ReadonlyArray<T>) => string)
): T => {
  if (arr.length !== 1) {
    const msg = typeof message === "function"
      ? message(arr)
      : message ?? `Expected exactly 1 element, got ${arr.length}`
    throw new AssertionError(msg)
  }
  return arr[0]
}

/**
 * Gets first element of array. Throws if empty.
 */
export const getFirst = <T>(arr: ReadonlyArray<T>, message?: string): T => {
  if (arr.length === 0) {
    throw new AssertionError(message ?? "Expected non-empty array")
  }
  return arr[0]
}

/**
 * Asserts array is non-empty. Returns the array with narrowed type.
 */
export const assertNonEmpty = <T>(
  arr: ReadonlyArray<T>,
  message?: string
): readonly [T, ...Array<T>] => {
  if (isNonEmpty(arr)) {
    return arr
  }
  throw new AssertionError(message ?? "Expected non-empty array")
}

/**
 * Type guard for non-empty arrays.
 */
export const isNonEmpty = <T>(arr: ReadonlyArray<T>): arr is readonly [T, ...Array<T>] => arr.length > 0

/**
 * Gets the single element if array has exactly 0 or 1 elements.
 * Returns Option.none() for empty, Option.some(element) for single.
 * Throws if array has 2+ elements.
 */
export const getOneOrNone = <T>(
  arr: ReadonlyArray<T>,
  message?: string
): Option.Option<T> => {
  if (arr.length === 0) {
    return Option.none()
  }
  if (arr.length === 1) {
    return Option.some(arr[0])
  }
  throw new AssertionError(
    message ?? `Expected 0 or 1 elements, got ${arr.length}`
  )
}

/**
 * Effect version: asserts value exists, fails with custom error if not.
 */
export const assertExistsEffect = <T, E>(
  value: T | null | undefined,
  onNone: () => E
): Effect.Effect<T, E> =>
  value !== null && value !== undefined
    ? Effect.succeed(value)
    : Effect.fail(onNone())

/**
 * Effect version: gets exactly one element, fails with custom error otherwise.
 */
export const getOnlyOneEffect = <T, E>(
  arr: ReadonlyArray<T>,
  onError: (arr: ReadonlyArray<T>) => E
): Effect.Effect<T, E> => arr.length === 1 ? Effect.succeed(arr[0]) : Effect.fail(onError(arr))

/**
 * Effect version: gets first element, fails with custom error if empty.
 */
export const getFirstEffect = <T, E>(
  arr: ReadonlyArray<T>,
  onEmpty: () => E
): Effect.Effect<T, E> => arr.length > 0 ? Effect.succeed(arr[0]) : Effect.fail(onEmpty())

/**
 * Effect version: gets 0 or 1 elements as Option, fails if 2+.
 */
export const getOneOrNoneEffect = <T, E>(
  arr: ReadonlyArray<T>,
  onTooMany: (arr: ReadonlyArray<T>) => E
): Effect.Effect<Option.Option<T>, E> => {
  if (arr.length === 0) return Effect.succeed(Option.none())
  if (arr.length === 1) return Effect.succeed(Option.some(arr[0]))
  return Effect.fail(onTooMany(arr))
}
