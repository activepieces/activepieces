export function isString(str: unknown): str is string {
    return str != null && typeof str === "string";
}

export function isNil<T>(value: T | null | undefined): value is null | undefined {
    return value === null || value === undefined;
}

export function pickBy<T extends Record<string, any>>(
    object: T,
    predicate: (value: T[keyof T], key: keyof T) => boolean
  ): Partial<T> {
    return Object.keys(object).reduce((result: Partial<T>, key: keyof T) => {
      if (predicate(object[key], key)) {
        result[key] = object[key];
      }
      return result;
    }, {});
  }
  