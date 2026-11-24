import { Property } from '@activepieces/pieces-framework';

function textOf(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function requiredId({ value, label }: { value: unknown; label: string }): string {
  const text = textOf(value);
  if (text === undefined) {
    throw new Error(`${label} is required.`);
  }
  return text;
}

function optionalId(value: unknown): string | undefined {
  return textOf(value);
}

function idList({ value, label }: { value: unknown; label: string }): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  const raw = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [value];
  const ids = raw.map((item) => textOf(item));
  const kept = ids.filter((id): id is string => id !== undefined);
  if (kept.length === 0) return undefined;
  if (kept.length !== ids.length) {
    throw new Error(`${label} has an empty entry. Remove it or give a valid ID.`);
  }
  return Array.from(new Set(kept));
}

function urlList({ value, label }: { value: unknown; label: string }): string[] {
  if (value === undefined || value === null) return [];
  const raw = Array.isArray(value) ? value : [value];
  const urls = raw.map((item) => textOf(item)).filter((url): url is string => url !== undefined);
  return urls.map((url) => httpUrl({ value: url, label }));
}

function httpUrl({ value, label }: { value: string; label: string }): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} "${value.slice(0, 80)}" is not a valid URL. Use a full public http(s) URL.`);
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`${label} "${value.slice(0, 80)}" must start with http:// or https://.`);
  }
  return value;
}

function isoDate({ value, label, future }: { value: unknown; label: string; future: boolean }): string | undefined {
  const text = textOf(value);
  if (text === undefined) return undefined;
  const match = ISO_WITH_ZONE.exec(text);
  const date = new Date(text);
  if (
    match === null ||
    Number.isNaN(date.getTime()) ||
    !isRealCalendarDay({ year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) })
  ) {
    throw new Error(`${label} "${text.slice(0, 60)}" is not a valid ISO 8601 date and time with a timezone, like 2026-12-01T09:00:00Z or 2026-12-01T11:00:00+02:00.`);
  }
  if (future && date.getTime() <= Date.now()) {
    throw new Error(`${label} "${text.slice(0, 60)}" is not in the future.`);
  }
  return date.toISOString();
}

function isRealCalendarDay({ year, month, day }: { year: number; month: number; day: number }): boolean {
  const check = new Date(Date.UTC(year, month - 1, day));
  return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day;
}

function oneOf<T extends string>({ value, allowed, label }: { value: unknown; allowed: readonly T[]; label: string }): T | undefined {
  const text = textOf(value);
  if (text === undefined) return undefined;
  const found = allowed.find((option) => option === text);
  if (found === undefined) {
    throw new Error(`${label} must be one of: ${allowed.join(', ')}.`);
  }
  return found;
}

function manyOf<T extends string>({ value, allowed, label }: { value: unknown; allowed: readonly T[]; label: string }): T[] | undefined {
  const items = idList({ value, label });
  if (items === undefined) return undefined;
  return items.map((item) => {
    const found = allowed.find((option) => option === item);
    if (found === undefined) {
      throw new Error(`${label} has "${item.slice(0, 40)}", which is not one of: ${allowed.join(', ')}.`);
    }
    return found;
  });
}

function yes(value: unknown): boolean {
  return textOf(value) === 'yes';
}

function pageSize(value: unknown): number {
  if (value === undefined || value === null || value === '') return DEFAULT_PAGE_SIZE;
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(number) || number < 1 || number > MAX_PAGE_SIZE) {
    throw new Error(`Limit must be a whole number from 1 to ${MAX_PAGE_SIZE}.`);
  }
  return number;
}

function jsonObject({ value, label }: { value: unknown; label: string }): Record<string, unknown> | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'string' ? parseJson({ text: value, label }) : value;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object keyed by service, like {"facebook": {"type": "post"}}.`);
  }
  const entries = Object.entries(parsed);
  return entries.length === 0 ? undefined : Object.fromEntries(entries);
}

function parseJson({ text, label }: { text: string; label: string }): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
}

function cleanList(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw.map((item) => textOf(item)).filter((item): item is string => item !== undefined);
}

function postContentFor({ service, text, images, link, metadata }: {
  service: string | undefined;
  text: string | undefined;
  images: string[];
  link: string | undefined;
  metadata?: Record<string, unknown>;
}): PostContent {
  const assets = images.map((url) => ({ image: { url } }));
  const base: Record<string, unknown> = { ...(metadata ?? {}) };
  if (service === 'facebook') {
    const existing = base['facebook'];
    base['facebook'] = isPlainObject(existing) ? { type: 'post', ...existing } : { type: 'post' };
  }
  const cardService = BUFFER_ENUMS.LINK_CARD_SERVICES.find((candidate) => candidate === service);
  if (link === undefined) {
    return { text, assets, metadata: Object.keys(base).length === 0 ? undefined : base };
  }
  if (cardService !== undefined && images.length === 0) {
    const existing = base[cardService];
    base[cardService] = { ...(isPlainObject(existing) ? existing : {}), linkAttachment: { url: link } };
    return { text, assets, metadata: base };
  }
  const body = text ?? '';
  const withLink = body.includes(link) ? body : body === '' ? link : `${body}\n\n${link}`;
  return { text: withLink, assets, metadata: Object.keys(base).length === 0 ? undefined : base };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function yesNoDropdown({ displayName, description }: { displayName: string; description: string }) {
  return Property.StaticDropdown<string, false>({
    displayName,
    description,
    required: false,
    defaultValue: 'no',
    options: {
      disabled: false,
      options: [
        { label: 'No', value: 'no' },
        { label: 'Yes', value: 'yes' },
      ],
    },
  });
}

function limitProp() {
  return Property.Number({
    displayName: 'Limit',
    description: `How many items to return in this page, 1 to ${MAX_PAGE_SIZE}. Default ${DEFAULT_PAGE_SIZE}.`,
    required: false,
    defaultValue: DEFAULT_PAGE_SIZE,
  });
}

function cursorProp() {
  return Property.ShortText({
    displayName: 'Cursor',
    description: 'Leave empty for the first page. To get the next page, pass nextCursor from the previous call with the same filters.',
    required: false,
  });
}

const ISO_WITH_ZONE = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})$/i;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export const bufferAiProps = {
  textOf,
  requiredId,
  optionalId,
  idList,
  urlList,
  isoDate,
  oneOf,
  manyOf,
  yes,
  pageSize,
  jsonObject,
  cleanList,
  postContentFor,
  yesNoDropdown,
  limitProp,
  cursorProp,
};

export const BUFFER_ENUMS = {
  POST_STATUSES: ['draft', 'needs_approval', 'scheduled', 'sending', 'sent', 'error'],
  SHARE_MODES: ['addToQueue', 'shareNext', 'shareNow', 'customScheduled'],
  SCHEDULING_TYPES: ['automatic', 'notification'],
  SORT_FIELDS: ['createdAt', 'dueAt'],
  SORT_DIRECTIONS: ['desc', 'asc'],
  LINK_CARD_SERVICES: ['facebook', 'linkedin', 'threads', 'bluesky', 'substack'],
} as const;

export const YOUTUBE_CATEGORIES = [
  { label: 'Film & Animation', value: '1' },
  { label: 'Autos & Vehicles', value: '2' },
  { label: 'Music', value: '10' },
  { label: 'Pets & Animals', value: '15' },
  { label: 'Sports', value: '17' },
  { label: 'Travel & Events', value: '19' },
  { label: 'Gaming', value: '20' },
  { label: 'People & Blogs', value: '22' },
  { label: 'Comedy', value: '23' },
  { label: 'Entertainment', value: '24' },
  { label: 'News & Politics', value: '25' },
  { label: 'Howto & Style', value: '26' },
  { label: 'Education', value: '27' },
  { label: 'Science & Technology', value: '28' },
  { label: 'Nonprofits & Activism', value: '29' },
];

export type PostContent = {
  text: string | undefined;
  assets: Array<{ image: { url: string } }>;
  metadata: Record<string, unknown> | undefined;
};
