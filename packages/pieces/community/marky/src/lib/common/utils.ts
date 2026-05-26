function getRequiredString({
  value,
  fieldName,
}: {
  value: unknown;
  fieldName: string;
}): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`);
  }
  return value.trim();
}

function getOptionalString({ value }: { value: unknown }): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function getOptionalStringArray({
  value,
  fieldName,
}: {
  value: unknown;
  fieldName: string;
}): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array of strings.`);
  }
  const result: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') {
      throw new Error(`${fieldName} must contain only strings.`);
    }
    const trimmed = item.trim();
    if (trimmed.length > 0) result.push(trimmed);
  }
  return result.length > 0 ? result : undefined;
}

function getOptionalBoolean({
  value,
  fieldName,
}: {
  value: unknown;
  fieldName: string;
}): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'boolean') {
    throw new Error(`${fieldName} must be a boolean.`);
  }
  return value;
}

function getOptionalPositiveInteger({
  value,
  fieldName,
}: {
  value: unknown;
  fieldName: string;
}): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
  return value;
}

const markyUtils = {
  getRequiredString,
  getOptionalString,
  getOptionalStringArray,
  getOptionalBoolean,
  getOptionalPositiveInteger,
};

export { markyUtils };
