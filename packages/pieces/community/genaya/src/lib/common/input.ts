// Helpers that turn step inputs into a Genaya request body. Empty inputs are
// left out of the body so they never overwrite or clear a stored value.

function text(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function number(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function textList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => text(entry)).filter((entry): entry is string => entry !== undefined);
}

function compact(values: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    result[key] = value;
  }
  return result;
}

function address(values: {
  line1: unknown;
  unit: unknown;
  city: unknown;
  state: unknown;
  zip: unknown;
  country: unknown;
}): Record<string, string> | undefined {
  const result = compact({
    line1: text(values.line1),
    unit: text(values.unit),
    city: text(values.city),
    state: text(values.state),
    zip: text(values.zip),
    country: text(values.country),
  });
  const entries = Object.entries(result).filter((entry): entry is [string, string] => typeof entry[1] === 'string');
  return entries.length === 0 ? undefined : Object.fromEntries(entries);
}

function record(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }
  const entries = Object.entries(value).filter(([key, entry]) => key !== '' && entry !== undefined && entry !== '');
  return entries.length === 0 ? undefined : Object.fromEntries(entries);
}

export const genayaInput = {
  text,
  number,
  textList,
  compact,
  address,
  record,
};
