import { totalcmsHelpers } from './client';

export const totalcmsShape = {
  typed,
  generic,
  parseFields,
  requireId,
};

function typed({ collection, object }: { collection: string; object: Record<string, unknown> }): Record<string, unknown> {
  return { collection, ...object };
}

function generic({ collection, object }: { collection: string; object: Record<string, unknown> }) {
  return { collection, id: String(object['id'] ?? ''), object };
}

function parseFields({ value, label }: { value: unknown; label: string }): Record<string, unknown> {
  const parsed = typeof value === 'string' ? parseJson({ text: value, label }) : value;
  if (!totalcmsHelpers.isRecord(parsed)) {
    throw new Error(`${label} must be a JSON object, for example {"title": "Hello"}.`);
  }
  if (Object.keys(parsed).length === 0) {
    throw new Error(`${label} is empty. Add at least one field.`);
  }
  return parsed;
}

function requireId({ value, label }: { value: unknown; label: string }): string {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(`${label} is required.`);
  }
  const text = String(value).trim();
  if (text.length === 0) {
    throw new Error(`${label} is required.`);
  }
  return text;
}

function parseJson({ text, label }: { text: string; label: string }): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
}
