/**
 * Request bodies for the SyncMate gateway, as pure functions so every shape is
 * unit-tested.
 *
 * Standard (QR-connected) numbers: POST /v1/message with `{ msgs: [...] }`.
 * One entry goes to the single send, several (or `time_gap`) to the bulk send.
 * Media travels as base64 inside each entry.
 *
 * Meta Cloud API numbers: POST /v1/meta/messages/{text|template|media} with
 * Assistro's flat payload (`to`, `body`, `template_name`, `media_url`, ...).
 */

export const RecipientType = { CONTACT: 1, GROUP: 2, CHANNEL: 3 } as const;
export type RecipientType = (typeof RecipientType)[keyof typeof RecipientType];

export type MediaItem = { media_base64: string; file_name: string };

export type StandardMessage = {
  number: string;
  message: string;
  type: RecipientType;
  media?: MediaItem[];
};

/** A phone number as Assistro takes it: country code, no spaces or punctuation. */
export function cleanPhone(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/[\s\-().]/g, '');
}

function withSuffix(value: unknown, suffix: string): string {
  const id = String(value ?? '').trim().replace(/\s+/g, '');
  if (id === '') return '';
  return id.endsWith(suffix) ? id : `${id}${suffix}`;
}

/** A WhatsApp group id: `1203...@g.us`. A bare id gets the suffix added. */
export function groupJid(value: unknown): string {
  return withSuffix(value, '@g.us');
}

/** A WhatsApp channel id: `1203...@newsletter`. A bare id gets the suffix added. */
export function channelJid(value: unknown): string {
  return withSuffix(value, '@newsletter');
}

/** Raw base64: drops a `data:...;base64,` prefix and whitespace. */
export function rawBase64(value: unknown): string {
  const text = String(value ?? '').trim();
  const comma = text.startsWith('data:') ? text.indexOf(',') : -1;
  return (comma >= 0 ? text.slice(comma + 1) : text).replace(/\s+/g, '');
}

/** Attachments from the legacy array prop, skipping half-filled rows. */
export function mediaFromArray(rows: unknown): MediaItem[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => (row ?? {}) as Record<string, unknown>)
    .map((row) => ({
      media_base64: rawBase64(row['media_base64']),
      file_name: String(row['file_name'] ?? '').trim(),
    }))
    .filter((m) => m.media_base64 !== '' && m.file_name !== '');
}

export function standardMessage(input: {
  number: string;
  message?: string | null;
  type: RecipientType;
  media?: MediaItem[];
}): StandardMessage {
  const message: StandardMessage = {
    number: input.number,
    message: input.message ?? '',
    type: input.type,
  };
  if (input.media && input.media.length > 0) {
    message.media = input.media;
  }
  return message;
}

export function assertSendable(message: StandardMessage, what: string): void {
  if (message.number === '') {
    throw new Error(`Enter the ${what}.`);
  }
  if (message.message.trim() === '' && !message.media?.length) {
    throw new Error('Enter a message or add an attachment.');
  }
}

/** One send to one recipient: always a single-entry `msgs`. */
export function singleBody(message: StandardMessage): { msgs: StandardMessage[] } {
  return { msgs: [message] };
}

/**
 * The same message to many contacts. Numbers are cleaned and de-duplicated;
 * `time_gap` (minutes between sends, at least 5) is only sent when given.
 */
export function bulkBody(input: {
  numbers: unknown[];
  message: string;
  media?: MediaItem[];
  timeGap?: number | null;
}): { msgs: StandardMessage[]; time_gap?: number } {
  const seen = new Set<string>();
  const numbers = input.numbers
    .flatMap((n) => String(n ?? '').split(/[,;\n]/))
    .map(cleanPhone)
    .filter((n) => n !== '' && !seen.has(n) && seen.add(n) !== undefined);

  if (numbers.length === 0) {
    throw new Error('Add at least one phone number.');
  }
  if (input.message.trim() === '' && !input.media?.length) {
    throw new Error('Enter a message or add an attachment.');
  }

  const body: { msgs: StandardMessage[]; time_gap?: number } = {
    msgs: numbers.map((number) =>
      standardMessage({ number, message: input.message, type: RecipientType.CONTACT, media: input.media })
    ),
  };

  if (input.timeGap !== undefined && input.timeGap !== null) {
    if (!Number.isInteger(input.timeGap) || input.timeGap < 5) {
      throw new Error('Time gap must be a whole number of minutes, 5 or more.');
    }
    body.time_gap = input.timeGap;
  }

  return body;
}

export function metaTextBody(to: unknown, text: string): Record<string, unknown> {
  const phone = cleanPhone(to);
  if (phone === '') throw new Error('Enter the recipient phone number.');
  if (text.trim() === '') throw new Error('Enter the message text.');
  return { to: phone, type: 'text', body: text };
}

export const META_MEDIA_TYPES = ['image', 'video', 'audio', 'document'] as const;
export type MetaMediaType = (typeof META_MEDIA_TYPES)[number];

/** A file to send as base64 (Assistro's MetaBase64MediaMiddleware turns it into an upload). */
export type MediaFile = { base64: string; fileName: string };

export function metaMediaBody(input: {
  to: unknown;
  mediaType: MetaMediaType;
  mediaUrl?: string | null;
  file?: MediaFile | null;
  caption?: string | null;
  fileName?: string | null;
}): Record<string, unknown> {
  const phone = cleanPhone(input.to);
  if (phone === '') throw new Error('Enter the recipient phone number.');
  if (!META_MEDIA_TYPES.includes(input.mediaType)) {
    throw new Error('Media type must be image, video, audio or document.');
  }
  const url = String(input.mediaUrl ?? '').trim();
  const file = input.file && rawBase64(input.file.base64) !== '' ? input.file : null;
  if (!file && url === '') {
    throw new Error('Add a file or enter a Media URL.');
  }
  if (!file && !/^https?:\/\//i.test(url)) {
    throw new Error('Media URL must be a public http(s) link.');
  }

  const body: Record<string, unknown> = { to: phone, media_type: input.mediaType };
  if (file) {
    body['media_base64'] = rawBase64(file.base64);
    body['media_filename'] = String(input.fileName ?? '').trim() || file.fileName;
  } else {
    body['media_url'] = url;
  }
  // Always send a caption key for captionable types: Assistro falls back to
  // the message text otherwise.
  if (input.mediaType !== 'audio') {
    body['caption'] = input.caption ?? '';
  }
  const fileName = String(input.fileName ?? '').trim();
  if (!file && input.mediaType === 'document' && fileName !== '') {
    body['media_filename'] = fileName;
  }
  return body;
}

export function metaTemplateBody(input: {
  to: unknown;
  templateName: string;
  language: string;
  variables?: Record<string, unknown>;
  headerMediaType?: 'image' | 'video' | 'document' | null;
  headerMediaUrl?: string | null;
  headerFile?: MediaFile | null;
}): Record<string, unknown> {
  const phone = cleanPhone(input.to);
  if (phone === '') throw new Error('Enter the recipient phone number.');
  const name = String(input.templateName ?? '').trim();
  if (name === '') throw new Error('Choose a template.');
  const language = String(input.language ?? '').trim();
  if (language === '') throw new Error('Enter the template language code, e.g. en or en_US.');

  const body: Record<string, unknown> = { to: phone, type: 'template', template_name: name, language };

  // Variables {{1}}, {{2}} ... go as template_params keyed "1", "2", ...
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(input.variables ?? {})) {
    const index = key.replace(/^var/, '');
    if (!/^\d+$/.test(index)) continue;
    if (value === null || value === undefined || String(value).trim() === '') continue;
    params[index] = String(value);
  }
  if (Object.keys(params).length > 0) {
    body['template_params'] = params;
  }

  // Header media goes as header_media_url / header_media_base64, not Meta `components`: Assistro's send job
  // only reads header media from `components` when there are no template_params, so a template with both
  // variables and a header image would lose the image.
  const headerUrl = String(input.headerMediaUrl ?? '').trim();
  const headerFile = input.headerFile && rawBase64(input.headerFile.base64) !== '' ? input.headerFile : null;
  if (headerFile) {
    body['header_media_base64'] = rawBase64(headerFile.base64);
    body['header_media_filename'] = headerFile.fileName;
  } else if (headerUrl !== '') {
    if (!/^https?:\/\//i.test(headerUrl)) throw new Error('Header Media URL must be a public http(s) link.');
    body['header_media_url'] = headerUrl;
  }
  if ((headerFile || headerUrl !== '') && input.headerMediaType) {
    body['header_media_type'] = input.headerMediaType;
  }

  return body;
}

/** A file name for a downloaded URL: the last path segment, else `file`. */
export function fileNameFromUrl(url: string, fallback = 'file'): string {
  try {
    const last = decodeURIComponent(new URL(url).pathname.split('/').pop() ?? '');
    return last.trim() !== '' ? last.trim() : fallback;
  } catch {
    return fallback;
  }
}
