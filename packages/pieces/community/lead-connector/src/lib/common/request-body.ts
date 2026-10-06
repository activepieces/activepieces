function omitEmptyValues<T extends object>(body: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key in body) {
    if (!isEmptyValue(body[key])) {
      result[key] = body[key];
    }
  }
  return result;
}

function isEmptyValue(value: unknown): boolean {
  return value === '' || (Array.isArray(value) && value.length === 0);
}

export const requestBodyUtils = {
  omitEmptyValues,
};
