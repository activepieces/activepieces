export const kickcallNumbers = {
  parsePositiveInteger,
};

function parsePositiveInteger({
  value,
  fallback,
  fieldName,
  maximum,
}: {
  value: unknown;
  fallback?: number;
  fieldName: string;
  maximum?: number;
}): number {
  if (value === undefined || value === null || value === '') {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`${fieldName} is required`);
  }
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value.trim())
        : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`${fieldName} must be a number greater than or equal to 1`);
  }
  const normalized = Math.floor(parsed);
  if (maximum !== undefined && normalized > maximum) {
    throw new Error(`${fieldName} must be at most ${maximum}`);
  }
  return normalized;
}
