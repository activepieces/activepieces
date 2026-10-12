const MAX_RECIPIENTS_PER_FIELD = 50;
const HEADER_NAME = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{1,256}$/;

function recipients({ value, label, required }: { value: unknown; label: string; required: boolean }): string[] | undefined {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? [value] : value === undefined || value === null ? [] : [value];
  const list = raw
    .flatMap((item) => (typeof item === 'string' ? splitAddresses(item) : typeof item === 'number' ? [String(item)] : []))
    .map((item) => item.trim())
    .filter((item) => item !== '');
  if (list.some((item) => /"[^"]*,[^"]*"/.test(item))) {
    throw new Error(`${label}: Emailit does not accept a comma inside a display name such as "Doe, Jane" <jane@example.com>. Remove the comma or use the bare address.`);
  }
  if (list.some((item) => /[\r\n]/.test(item))) {
    throw new Error(`${label} must not contain line breaks.`);
  }
  if (list.length > MAX_RECIPIENTS_PER_FIELD) {
    throw new Error(`${label} accepts at most ${MAX_RECIPIENTS_PER_FIELD} addresses (got ${list.length}).`);
  }
  if (list.length === 0) {
    if (required) {
      throw new Error(`${label} needs at least one email address.`);
    }
    return undefined;
  }
  return list;
}

function headers(value: unknown): Record<string, string> | undefined {
  const record = objectInput({ value, label: 'Custom Headers' });
  if (record === undefined) return undefined;
  const entries = Object.entries(record).map(([key, item]): [string, string] => {
    const name = key.trim();
    const text = typeof item === 'string' ? item : typeof item === 'number' || typeof item === 'boolean' ? String(item) : '';
    if (!HEADER_NAME.test(name)) {
      throw new Error(`Custom header name "${name}" is not a valid header name.`);
    }
    if (/[\r\n\0]/.test(text)) {
      throw new Error(`Custom header "${name}" must not contain line breaks.`);
    }
    return [name, text];
  });
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function objectInput({ value, label }: { value: unknown; label: string }): Record<string, unknown> | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'string' ? parseJson({ text: value, label }) : value;
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  const record = Object.fromEntries(Object.entries(parsed));
  return Object.keys(record).length > 0 ? record : undefined;
}

function stringMap({ value, label }: { value: unknown; label: string }): Record<string, string> | undefined {
  const record = objectInput({ value, label });
  if (record === undefined) return undefined;
  return Object.fromEntries(
    Object.entries(record).map(([key, item]) => [key, typeof item === 'string' ? item : JSON.stringify(item)]),
  );
}

function parseJson({ text, label }: { text: string; label: string }): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
}

function idempotencyKey(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  if (text === '') return undefined;
  if (!IDEMPOTENCY_KEY.test(text)) {
    throw new Error('Idempotency Key must be 1-256 letters, digits, "-" or "_".');
  }
  return text;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text === '' ? undefined : text;
}

function requiredText({ value, label }: { value: unknown; label: string }): string {
  const text = optionalText(value);
  if (text === undefined) {
    throw new Error(`${label} is required.`);
  }
  return text;
}

function singleLine({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = optionalText(value);
  if (text !== undefined && /[\r\n]/.test(text)) {
    throw new Error(`${label} must not contain line breaks.`);
  }
  return text;
}

function dateTime(value: unknown): string | undefined {
  const text = optionalText(value);
  if (text === undefined) return undefined;
  const parsed = Date.parse(text);
  if (Number.isNaN(parsed)) {
    throw new Error(`"${text}" is not a valid date-time. Use ISO 8601, e.g. 2026-10-02T09:00:00Z.`);
  }
  return new Date(parsed).toISOString();
}

function sender({ name, email }: { name: unknown; email: unknown }): string {
  const address = singleLine({ value: email, label: 'Sender Email' });
  if (address === undefined) {
    throw new Error('Sender Email is required.');
  }
  const display = singleLine({ value: name, label: 'Sender Name' });
  if (display === undefined) return address;
  if (/["\\<>]/.test(display)) {
    throw new Error('Sender Name cannot contain quotes, backslashes or angle brackets: Emailit rejects them.');
  }
  return `"${display}" <${address}>`;
}

function splitAddresses(text: string): string[] {
  const list: string[] = [];
  let start = 0;
  let quoted = false;
  let angle = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted && char === '\\') {
      index++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === '<') {
      angle = true;
    } else if (!quoted && char === '>') {
      angle = false;
    } else if (!quoted && !angle && char === ',') {
      list.push(text.slice(start, index));
      start = index + 1;
    }
  }
  list.push(text.slice(start));
  return list;
}

function tracking(value: unknown): boolean | undefined {
  if (value === 'on') return true;
  if (value === 'off') return false;
  return undefined;
}

function attachmentsFromUrls(value: unknown): Array<{ filename: string; url: string }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): Array<{ filename: string; url: string }> => {
    if (item === null || typeof item !== 'object') return [];
    const filename = optionalText(Reflect.get(item, 'filename'));
    const url = optionalText(Reflect.get(item, 'url'));
    if (filename === undefined && url === undefined) return [];
    if (filename === undefined || url === undefined) {
      throw new Error('Each attachment needs both a file name and a URL.');
    }
    if (!/^https?:\/\//i.test(url)) {
      throw new Error(`Attachment URL for "${filename}" must start with http:// or https://.`);
    }
    return [{ filename, url }];
  });
}

function attachmentFromFile(value: unknown): { filename: string; content: string; content_type: string } | undefined {
  if (value === undefined || value === null || typeof value !== 'object') return undefined;
  const filename = optionalText(Reflect.get(value, 'filename'));
  const base64 = Reflect.get(value, 'base64');
  const data = Reflect.get(value, 'data');
  const content = typeof base64 === 'string' && base64 !== '' ? base64 : Buffer.isBuffer(data) ? data.toString('base64') : undefined;
  if (filename === undefined || content === undefined) {
    throw new Error('The attached file could not be read.');
  }
  return { filename, content, content_type: mimeType(filename) };
}

function mimeType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() ?? '';
  return MIME_TYPES[extension] ?? 'application/octet-stream';
}

function compact(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  txt: 'text/plain',
  csv: 'text/csv',
  ics: 'text/calendar',
  xml: 'application/xml',
  zip: 'application/zip',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  eml: 'message/rfc822',
};

export const emailitValues = {
  recipients,
  headers,
  objectInput,
  stringMap,
  idempotencyKey,
  optionalText,
  requiredText,
  singleLine,
  dateTime,
  sender,
  tracking,
  attachmentsFromUrls,
  attachmentFromFile,
  compact,
  MAX_RECIPIENTS_PER_FIELD,
};
