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
  if (
    !isRecord(value) ||
    Object.values(value).some((entry) => typeof entry !== 'string')
  ) {
    throw new Error(
      'Template parameters must be key/value pairs with text values.'
    );
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, String(entry)])
  );
}

export const sentValues = {
  isRecord,
  optionalString,
  requiredString,
  stringMap,
};
