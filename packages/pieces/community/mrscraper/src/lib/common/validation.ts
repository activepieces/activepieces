function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredText({ value, field }: TextParams): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} must be a nonblank string.`);
  }
  return value.trim();
}

function optionalText({ value, field }: TextParams): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string.`);
  }
  return value.trim().length === 0 ? undefined : value.trim();
}

function url({ value, field }: TextParams): string {
  const text = requiredText({ value, field });
  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    throw new Error(`${field} must be a valid absolute URL, such as https://example.com/page.`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`${field} must use http or https.`);
  }
  return parsed.toString();
}

function integer({ value, field, defaultValue, minimum }: IntegerParams): number {
  const resolved = value ?? defaultValue;
  if (typeof resolved !== 'number' || !Number.isInteger(resolved)) {
    throw new Error(`${field} must be an integer.`);
  }
  if (minimum !== undefined && resolved < minimum) {
    throw new Error(`${field} must be at least ${minimum}.`);
  }
  return resolved;
}

function oneOf<T extends string>({ value, field, values, defaultValue }: EnumParams<T>): T {
  const resolved = value ?? defaultValue;
  const matched = values.find((candidate) => candidate === resolved);
  if (matched === undefined) {
    throw new Error(`${field} must be one of: ${values.join(', ')}.`);
  }
  return matched;
}

function code({ value, field, defaultValue }: CodeParams): string | undefined {
  const resolved = value ?? defaultValue;
  if (resolved === undefined) {
    return undefined;
  }
  const text = requiredText({ value: resolved, field });
  if (!/^[A-Za-z]{2}$/.test(text)) {
    throw new Error(`${field} must be a two-letter code, such as us, GB, or en.`);
  }
  return text;
}

function record({ value, field, defaultValue }: RecordParams): Record<string, unknown> {
  const resolved = value ?? defaultValue;
  if (!isRecord(resolved)) {
    throw new Error(`${field} must be a JSON object.`);
  }
  return resolved;
}

function records({ value, field, defaultValue }: RecordsParams): Record<string, unknown>[] {
  const resolved = value ?? defaultValue;
  if (!Array.isArray(resolved) || resolved.some((item) => !isRecord(item))) {
    throw new Error(`${field} must be an array of JSON objects.`);
  }
  return resolved.filter(isRecord);
}

function urls(value: unknown): string[] {
  const normalized = normalizeUrlInput(value);
    const trimmed = normalized
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0)
    .map((item, index) => url({ value: item, field: `URLs item ${index + 1}` }));
  if (trimmed.length === 0) {
    throw new Error('URLs must contain at least one nonblank URL.');
  }
  return trimmed;
}

function normalizeUrlInput(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    throw new Error('URLs must be an array, a JSON array string, or a comma/newline-separated list.');
  }
  const text = value.trim();
  if (text.startsWith('[')) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('URLs contains invalid JSON.');
    }
    if (!Array.isArray(parsed)) {
      throw new Error('URLs JSON must be an array.');
    }
    return parsed;
  }
  return text.split(/[,\n]/);
}

export const mrscraperValidation = {
  code,
  integer,
  oneOf,
  optionalText,
  record,
  records,
  requiredText,
  url,
  urls,
};

type TextParams = {
  value: unknown;
  field: string;
};

type IntegerParams = TextParams & {
  defaultValue: number;
  minimum?: number;
};

type CodeParams = TextParams & {
  defaultValue?: string;
};

type EnumParams<T extends string> = TextParams & {
  values: readonly T[];
  defaultValue: T;
};

type RecordParams = TextParams & {
  defaultValue: Record<string, unknown>;
};

type RecordsParams = TextParams & {
  defaultValue: Record<string, unknown>[];
};
