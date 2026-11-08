const MEGABYTE = 1024 * 1024;
const MAX_SOURCE_BYTES = 5 * MEGABYTE;
const MAX_ARTIFACT_BYTES = 4 * MEGABYTE;
const MAX_TEMPLATE_DATA_BYTES = 256 * 1024;

const SOURCE_LABELS: Record<SourceKey, string> = { url: 'URL', html: 'HTML', markdown: 'Markdown' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text === '' ? undefined : text;
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

function numberOf({ value, label, min, max, integer }: NumberRule & { value: unknown }): number | undefined {
  if (isBlank(value)) return undefined;
  const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.trim()) : Number.NaN;
  const kind = integer ? 'a whole number' : 'a number';
  if (!Number.isFinite(number) || (integer && !Number.isInteger(number)) || number < min || number > max) {
    throw new Error(`${label} must be ${kind} from ${min} to ${max}. Got "${String(value).slice(0, 40)}".`);
  }
  return number;
}

function flagOf({ value, label }: { value: unknown; label: string }): boolean | undefined {
  if (isBlank(value)) return undefined;
  if (value === true || value === 'yes') return true;
  if (value === false || value === 'no') return false;
  throw new Error(`${label} must be "yes" or "no". Got "${String(value).slice(0, 40)}".`);
}

function choiceOf({ value, label, allowed }: { value: unknown; label: string; allowed: readonly string[] }): string | undefined {
  if (isBlank(value)) return undefined;
  const text = typeof value === 'string' ? value.trim() : '';
  if (!allowed.includes(text)) {
    throw new Error(`${label} must be one of: ${allowed.join(', ')}. Got "${String(value).slice(0, 40)}".`);
  }
  return text;
}

function textOf({ value, label, maxLength }: { value: unknown; label: string; maxLength: number }): string | undefined {
  if (isBlank(value)) return undefined;
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(`${label} must be text.`);
  }
  const text = String(value).trim();
  if (text.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  }
  return text;
}

function textListOf({ value, label, maxItems, maxLength }: { value: unknown; label: string; maxItems: number; maxLength: number }): string[] | undefined {
  if (isBlank(value)) return undefined;
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split('\n') : [value];
  const items = raw.map((item) => {
    if (typeof item !== 'string' && typeof item !== 'number') {
      throw new Error(`Each entry in ${label} must be text.`);
    }
    return String(item).trim();
  }).filter((item) => item !== '');
  if (items.length === 0) return undefined;
  if (items.length > maxItems) {
    throw new Error(`${label} accepts at most ${maxItems} entries. Got ${items.length}.`);
  }
  const tooLong = items.find((item) => item.length > maxLength);
  if (tooLong !== undefined) {
    throw new Error(`Each entry in ${label} must be ${maxLength} characters or fewer.`);
  }
  return items;
}

function jsonObjectOf({ value, label, maxBytes }: { value: unknown; label: string; maxBytes: number }): Record<string, unknown> | undefined {
  if (isBlank(value)) return undefined;
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error(`${label} must be a JSON object, like {"name": "Ada"}.`);
    }
  }
  if (!isRecord(parsed)) {
    throw new Error(`${label} must be a JSON object, like {"name": "Ada"}.`);
  }
  if (Object.keys(parsed).length === 0) return undefined;
  if (Buffer.byteLength(JSON.stringify(parsed), 'utf8') > maxBytes) {
    throw new Error(`${label} must be ${Math.round(maxBytes / 1024)} KB or smaller once serialized.`);
  }
  return parsed;
}

function checkContentSize({ value, label, maxBytes }: { value: string; label: string; maxBytes: number }): void {
  const size = Buffer.byteLength(value, 'utf8');
  if (size > maxBytes) {
    throw new Error(`${label} is ${size.toLocaleString('en-US')} bytes; Rendex accepts at most ${maxBytes.toLocaleString('en-US')} bytes (${maxBytes / MEGABYTE} MB). Send smaller content.`);
  }
}

function sourceOf({ url, html, markdown }: { url: unknown; html: unknown; markdown: unknown }): Source {
  const given: Source[] = [];
  const urlText = optionalText(url);
  if (urlText !== undefined) given.push({ key: 'url', value: urlText });
  if (typeof html === 'string' && html.trim() !== '') given.push({ key: 'html', value: html });
  if (typeof markdown === 'string' && markdown.trim() !== '') given.push({ key: 'markdown', value: markdown });
  if (given.length === 0) {
    throw new Error('Give exactly one source: URL, HTML or Markdown. All three are empty.');
  }
  if (given.length > 1) {
    throw new Error(`Give exactly one source: URL, HTML or Markdown. You gave ${given.map((source) => SOURCE_LABELS[source.key]).join(' and ')}.`);
  }
  const source = given[0];
  if (source.key !== 'url') {
    checkContentSize({ value: source.value, label: SOURCE_LABELS[source.key], maxBytes: MAX_SOURCE_BYTES });
  }
  return source;
}

function templateDataOf({ value, source }: { value: unknown; source: Source }): Record<string, unknown> | undefined {
  const data = jsonObjectOf({ value, label: 'Template Data', maxBytes: MAX_TEMPLATE_DATA_BYTES });
  if (data !== undefined && source.key === 'url') {
    throw new Error('Template Data only works with HTML or Markdown, not with a URL. Remove Template Data or render HTML/Markdown instead.');
  }
  return data;
}

function compact(input: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

function renderTimeoutMs({ timeoutSeconds, delayMs }: { timeoutSeconds: number | undefined; delayMs: number | undefined }): number {
  return ((timeoutSeconds ?? 60) + 30) * 1000 + (delayMs ?? 0);
}

export const RENDEX_BASE_URL = 'https://api.rendex.dev';

export const RENDEX_LIMITS = {
  MAX_SOURCE_BYTES,
  MAX_ARTIFACT_BYTES,
  MAX_TEMPLATE_DATA_BYTES,
  READ_TIMEOUT_MS: 30_000,
  RENDER_TIMEOUT_MS: 90_000,
  WIDTH: { label: 'Width', min: 320, max: 3840, integer: true },
  HEIGHT: { label: 'Height', min: 240, max: 2160, integer: true },
  TIMEOUT: { label: 'Timeout (seconds)', min: 5, max: 60, integer: true },
  DELAY: { label: 'Delay (ms)', min: 0, max: 10000, integer: true },
  QUALITY: { label: 'Quality', min: 1, max: 100, integer: true },
  EXPIRES: { label: 'Expires In (seconds)', min: 3600, max: 2592000, integer: true },
  INTERVAL: { label: 'Check Interval (minutes)', min: 5, max: 43200, integer: true },
  THRESHOLD: { label: 'Threshold', min: 0, max: 1, integer: false },
  LIMIT: { label: 'Limit', min: 1, max: 100, integer: true },
} satisfies Record<string, NumberRule | number>;

export const rendexInput = {
  isRecord,
  optionalText,
  numberOf,
  flagOf,
  choiceOf,
  textOf,
  textListOf,
  jsonObjectOf,
  checkContentSize,
  sourceOf,
  templateDataOf,
  compact,
  renderTimeoutMs,
};

type NumberRule = { label: string; min: number; max: number; integer: boolean };

type SourceKey = 'url' | 'html' | 'markdown';

type Source = { key: SourceKey; value: string };

export type { Source, SourceKey, NumberRule };
