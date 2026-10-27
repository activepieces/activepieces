function format({ result, format }: {
  result: Record<string, unknown>;
  format: unknown;
}): Record<string, unknown> {
  if (format === 'raw') return result;
  if (format !== undefined && format !== 'table') {
    throw new Error('Select Table-Friendly Fields or Original Structured Fields.');
  }
  return Object.fromEntries(Object.entries(result).map(([key, value]) => [
    key,
    value !== null && typeof value === 'object' ? JSON.stringify(value) : value,
  ]));
}

function validate(format: unknown): void {
  if (format !== undefined && format !== 'table' && format !== 'raw') {
    throw new Error('Select Table-Friendly Fields or Original Structured Fields.');
  }
}

export const aiScraperOutput = { format, validate };
