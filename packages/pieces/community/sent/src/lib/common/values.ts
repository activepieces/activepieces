function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function requiredString({
  value,
  label,
}: {
  value: unknown;
  label: string;
}): string {
  const result = optionalString(value);
  if (!result) throw new Error(`${label} is required.`);
  return result;
}

function stringMap(value: unknown): Record<string, string> {
  if (value === undefined || value === null) return {};
  if (!isRecord(value) || !Object.values(value).every(isScalar)) {
    throw new Error(
      'Template parameters must be key/value pairs with text, number, or true/false values.'
    );
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, String(entry)])
  );
}

function isScalar(value: unknown): value is string | number | boolean {
  return (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  );
}

export const sentValues = {
  isRecord,
  optionalString,
  requiredString,
  stringMap,
};
