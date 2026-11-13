import { Property } from '@activepieces/pieces-framework';
import { ForeplayQuery } from './client';

const SORT_ORDERS = ['newest', 'oldest', 'longest_running', 'most_relevant'];
const SWIPEFILE_ORDERS = ['saved_newest', 'newest', 'oldest', 'longest_running', 'most_relevant'];
const BRAND_ORDERS = ['most_ranked', 'least_ranked'];
const DISPLAY_FORMATS = ['video', 'image', 'carousel', 'dco', 'dpa', 'multi_images', 'multi_videos', 'multi_medias', 'event', 'text', 'page_like'];
const PUBLISHER_PLATFORMS = ['facebook', 'instagram', 'audience_network', 'messenger', 'tiktok', 'youtube', 'linkedin', 'threads', 'whatsapp'];
const NICHES = ['accessories', 'app/software', 'beauty', 'business/professional', 'charity/nfp', 'education', 'entertainment', 'fashion', 'food/drink', 'health/wellness', 'home/garden', 'jewelry/watches', 'kids/baby', 'medical', 'other', 'parenting', 'pets', 'real estate', 'service business'];
const LEGACY_NICHES: Record<string, string> = { food: 'food/drink', health: 'health/wellness', home: 'home/garden', technology: 'app/software' };
const DROPPED_NICHES = ['finance', 'sports', 'travel', 'automotive'];
const HUMAN_NICHE_OPTIONS = [
  ...options(NICHES),
  ...[...Object.keys(LEGACY_NICHES), ...DROPPED_NICHES].map((n) => ({ label: `${label(n)} (legacy)`, value: n })),
];
const MARKET_TARGETS = ['b2b', 'b2c'];
const LANGUAGES = ['Afrikaans', 'Albanian', 'Arabic', 'Armenian', 'Azerbaijani', 'Bambara', 'Basque', 'Bengali', 'Bosnian', 'Bulgarian', 'Burmese', 'Catalan, Valencian', 'Central Khmer', 'Chichewa, Chewa, Nyanja', 'Corsican', 'Croatian', 'Czech', 'Danish', 'Dutch, Flemish', 'English', 'Estonian', 'Finnish', 'French', 'Galician', 'Georgian', 'German', 'Greek (modern)', 'Guaraní', 'Hausa', 'Hebrew (modern)', 'Hindi', 'Hungarian', 'Icelandic', 'Indonesian', 'Italian', 'Japanese', 'Javanese', 'Kannada', 'Kazakh', 'Korean', 'Latin', 'Latvian', 'Lingala', 'Lithuanian', 'Luxembourgish, Letzeburgesch', 'Macedonian', 'Malagasy', 'Malay', 'Malayalam', 'Maltese', 'Maori', 'Marathi', 'Mongolian', 'Norwegian', 'Oriya', 'Oromo', 'Persian', 'Polish', 'Portuguese', 'Romanian, Moldavian, Moldovan', 'Russian', 'Serbian', 'Shona', 'Sinhala, Sinhalese', 'Slovak', 'Slovene', 'Spanish, Castilian', 'Sundanese', 'Swedish', 'Telugu', 'Thai', 'Turkish', 'Turkmen', 'Ukrainian', 'Urdu', 'Uzbek', 'Vietnamese', 'Welsh', 'Western Frisian'];
const LANGUAGE_RE = /^[\p{L} ,()-]{2,60}$/u;
const ID_RE = /^[A-Za-z0-9_.:-]{1,128}$/;
const NUMERIC_ID_RE = /^\d{1,30}$/;

function label(value: string): string {
  return value.replace(/_/g, ' ').replace(/(^|[ /])([a-z])/g, (_m, sep: string, ch: string) => `${sep}${ch.toUpperCase()}`);
}

function options(values: string[]) {
  return values.map((value) => ({ label: label(value), value }));
}

function optionalText(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text === '' ? undefined : text;
}

function requiredText({ value, label }: { value: unknown; label: string }): string {
  const text = optionalText(value);
  if (text === undefined) throw new Error(`${label} is required.`);
  return text;
}

function foreplayId({ value, label }: { value: unknown; label: string }): string {
  const text = requiredText({ value, label });
  if (!ID_RE.test(text)) throw new Error(`${label} must be a Foreplay ID (letters, digits, "_", "-", "." or ":").`);
  return text;
}

function pageId({ value, label }: { value: unknown; label: string }): string {
  const text = requiredText({ value, label });
  if (!NUMERIC_ID_RE.test(text)) throw new Error(`${label} must be a numeric Facebook page ID, e.g. 373652569755921.`);
  return text;
}

function parseInteger({ value, label, min, max }: { value: unknown; label: string; min: number; max: number }): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'string' ? Number(value.trim()) : value;
  if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  }
  return parsed;
}

function parseNumber({ value, label, min }: { value: unknown; label: string; min: number }): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'string' ? Number(value.trim()) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed) || parsed < min) throw new Error(`${label} must be a number of at least ${min}.`);
  return parsed;
}

function parseBoolean({ value, label }: { value: unknown; label: string }): boolean | undefined {
  const v = Array.isArray(value) && value.length === 1 ? value[0] : value;
  if (v === undefined || v === null || v === '') return undefined;
  if (v === true || v === 'true') return true;
  if (v === false || v === 'false') return false;
  throw new Error(`${label} must be true or false.`);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function apiDate({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = optionalText(value);
  if (text === undefined) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(Date.parse(`${text}T00:00:00Z`))) return text;
  const time = Date.parse(text);
  if (Number.isNaN(time)) throw new Error(`${label} must be a date like 2026-10-18 or 2026-10-18T12:00:00Z.`);
  const d = new Date(time);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

function dayOnly({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = apiDate({ value, label });
  return text === undefined ? undefined : text.slice(0, 10);
}

function stringList({ value, label }: { value: unknown; label: string }): string[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : null;
  if (raw === null) throw new Error(`${label} must be a list of text values.`);
  const list = raw.map((v) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '')).filter((v) => v !== '');
  return list.length > 0 ? list : undefined;
}

function enumList({ value, label, allowed, aliases, dropped }: { value: unknown; label: string; allowed: string[]; aliases?: Record<string, string>; dropped?: string[] }): string[] | undefined {
  const list = stringList({ value, label });
  if (list === undefined) return undefined;
  const out: string[] = [];
  const droppedUsed: string[] = [];
  for (const v of list) {
    const lower = v.toLowerCase();
    if (dropped?.includes(lower)) {
      droppedUsed.push(v);
      continue;
    }
    const mapped = aliases?.[lower] ?? lower;
    if (!allowed.includes(mapped)) throw new Error(`${label}: "${v}" is not supported. Use one of: ${allowed.join(', ')}.`);
    out.push(mapped);
  }
  const unique = [...new Set(out)];
  if (unique.length === 0 && droppedUsed.length > 0) throw new Error(`${label}: ${droppedUsed.map((v) => `"${v}"`).join(', ')} ${droppedUsed.length === 1 ? 'is' : 'are'} no longer supported by Foreplay, so this filter would match every ad. Pick one of: ${allowed.join(', ')}, or clear the filter.`);
  return unique.length === 0 ? undefined : unique;
}

function enumValue({ value, label, allowed }: { value: unknown; label: string; allowed: string[] }): string | undefined {
  const text = optionalText(value);
  if (text === undefined) return undefined;
  if (!allowed.includes(text)) throw new Error(`${label} must be one of: ${allowed.join(', ')}.`);
  return text;
}

function languageList({ value, label }: { value: unknown; label: string }): string[] | undefined {
  const list = stringList({ value, label });
  if (list === undefined) return undefined;
  for (const v of list) {
    if (!LANGUAGE_RE.test(v)) throw new Error(`${label}: "${v}" is not a language name or code, e.g. English, french or FR.`);
  }
  return list;
}

function liveValue(value: unknown): string | undefined {
  const live = parseBoolean({ value, label: 'Live Status' });
  return live === undefined ? undefined : String(live);
}

function adFilterQuery(filters: AdFilterInput): ForeplayQuery {
  const query: ForeplayQuery = {
    start_date: apiDate({ value: filters.startDate, label: 'Start Date' }),
    end_date: apiDate({ value: filters.endDate, label: 'End Date' }),
    live: liveValue(filters.live),
    display_format: enumList({ value: filters.displayFormats, label: 'Display Format', allowed: DISPLAY_FORMATS }),
    publisher_platform: enumList({ value: filters.publisherPlatforms, label: 'Publisher Platform', allowed: PUBLISHER_PLATFORMS }),
    niches: enumList({ value: filters.niches, label: 'Niches', allowed: NICHES, aliases: LEGACY_NICHES, dropped: DROPPED_NICHES }),
    market_target: enumList({ value: filters.marketTargets, label: 'Market Target', allowed: MARKET_TARGETS }),
    languages: languageList({ value: filters.languages, label: 'Languages' }),
    video_duration_min: parseNumber({ value: filters.videoDurationMin, label: 'Min Video Duration', min: 0 }),
    video_duration_max: parseNumber({ value: filters.videoDurationMax, label: 'Max Video Duration', min: 0 }),
    running_duration_min_days: parseInteger({ value: filters.runningDurationMinDays, label: 'Min Running Days', min: 0, max: 100_000 }),
    running_duration_max_days: parseInteger({ value: filters.runningDurationMaxDays, label: 'Max Running Days', min: 0, max: 100_000 }),
  };
  const vMin = query['video_duration_min'];
  const vMax = query['video_duration_max'];
  if (typeof vMin === 'number' && typeof vMax === 'number' && vMin > vMax) throw new Error('Min Video Duration must not be greater than Max Video Duration.');
  const rMin = query['running_duration_min_days'];
  const rMax = query['running_duration_max_days'];
  if (typeof rMin === 'number' && typeof rMax === 'number' && rMin > rMax) throw new Error('Min Running Days must not be greater than Max Running Days.');
  const start = query['start_date'];
  const end = query['end_date'];
  if (typeof start === 'string' && typeof end === 'string' && start.slice(0, 10) > end.slice(0, 10)) throw new Error('Start Date must be on or before End Date.');
  return query;
}

function aiAdFilterProps({ withDates = true, withRunningDays = true }: { withDates?: boolean; withRunningDays?: boolean } = {}) {
  return {
    ...(withDates
      ? {
          startDate: Property.ShortText({ displayName: 'Start Date', description: 'Inclusive, YYYY-MM-DD or ISO 8601 date-time.', required: false }),
          endDate: Property.ShortText({ displayName: 'End Date', description: 'Inclusive, YYYY-MM-DD or ISO 8601 date-time.', required: false }),
        }
      : {}),
    live: Property.StaticDropdown({ displayName: 'Live Status', description: 'true = running now, false = stopped; empty = both.', required: false, options: { options: [{ label: 'Active only', value: 'true' }, { label: 'Inactive only', value: 'false' }] } }),
    displayFormats: Property.StaticMultiSelectDropdown({ displayName: 'Display Formats', required: false, options: { options: options(DISPLAY_FORMATS) } }),
    publisherPlatforms: Property.StaticMultiSelectDropdown({ displayName: 'Publisher Platforms', required: false, options: { options: options(PUBLISHER_PLATFORMS) } }),
    niches: Property.StaticMultiSelectDropdown({ displayName: 'Niches', required: false, options: { options: options(NICHES) } }),
    marketTargets: Property.StaticMultiSelectDropdown({ displayName: 'Market Targets', required: false, options: { options: [{ label: 'B2B', value: 'b2b' }, { label: 'B2C', value: 'b2c' }] } }),
    languages: Property.StaticMultiSelectDropdown({ displayName: 'Languages', required: false, options: { options: LANGUAGES.map((l) => ({ label: l, value: l })) } }),
    videoDurationMin: Property.Number({ displayName: 'Min Video Duration (seconds)', required: false }),
    videoDurationMax: Property.Number({ displayName: 'Max Video Duration (seconds)', required: false }),
    ...(withRunningDays
      ? {
          runningDurationMinDays: Property.Number({ displayName: 'Min Running Days', required: false }),
          runningDurationMaxDays: Property.Number({ displayName: 'Max Running Days', required: false }),
        }
      : {}),
  };
}

function aiAdFilterInput(props: Record<string, unknown>): AdFilterInput {
  return {
    startDate: props['startDate'],
    endDate: props['endDate'],
    live: props['live'],
    displayFormats: props['displayFormats'],
    publisherPlatforms: props['publisherPlatforms'],
    niches: props['niches'],
    marketTargets: props['marketTargets'],
    languages: props['languages'],
    videoDurationMin: props['videoDurationMin'],
    videoDurationMax: props['videoDurationMax'],
    runningDurationMinDays: props['runningDurationMinDays'],
    runningDurationMaxDays: props['runningDurationMaxDays'],
  };
}

const HUMAN_LANGUAGE_OPTIONS = [
  { label: 'English', value: 'english' },
  { label: 'French', value: 'french' },
  { label: 'German', value: 'german' },
  { label: 'Italian', value: 'italian' },
  { label: 'Dutch/Flemish', value: 'dutch, flemish' },
  { label: 'Spanish', value: 'spanish' },
  { label: 'Portuguese', value: 'portuguese' },
  { label: 'Romanian', value: 'romanian' },
  { label: 'Russian', value: 'russian' },
  { label: 'Chinese', value: 'chinese' },
  { label: 'Japanese', value: 'japanese' },
  { label: 'Korean', value: 'korean' },
  { label: 'Arabic', value: 'arabic' },
  { label: 'Hindi', value: 'hindi' },
];

function humanAdFilterProps({ withDates = true }: { withDates?: boolean } = {}) {
  return {
    ...(withDates
      ? {
          start_date: Property.DateTime({ displayName: 'Start Date', description: 'Only ads from this date (inclusive).', required: false }),
          end_date: Property.DateTime({ displayName: 'End Date', description: 'Only ads up to this date (inclusive).', required: false }),
        }
      : {}),
    live: Property.StaticDropdown({ displayName: 'Live Status', description: 'Filter by whether the ad is running now.', required: false, options: { options: [{ label: 'Active Only', value: 'true' }, { label: 'Inactive Only', value: 'false' }] } }),
    display_format: Property.StaticMultiSelectDropdown({ displayName: 'Display Format', description: 'Filter by one or more display formats.', required: false, options: { options: options(DISPLAY_FORMATS) } }),
    publisher_platform: Property.StaticMultiSelectDropdown({ displayName: 'Publisher Platform', description: 'Filter by one or more publisher platforms.', required: false, options: { options: options(PUBLISHER_PLATFORMS) } }),
    niches: Property.StaticMultiSelectDropdown({ displayName: 'Niches', description: 'Filter by one or more niches.', required: false, options: { options: HUMAN_NICHE_OPTIONS } }),
    market_target: Property.StaticMultiSelectDropdown({ displayName: 'Market Target', description: 'Filter by market target.', required: false, options: { options: [{ label: 'B2B (Business-to-Business)', value: 'b2b' }, { label: 'B2C (Business-to-Consumer)', value: 'b2c' }] } }),
    languages: Property.StaticMultiSelectDropdown({ displayName: 'Languages', description: 'Filter by ad language.', required: false, options: { options: HUMAN_LANGUAGE_OPTIONS } }),
  };
}

function humanAdFilterInput(props: Record<string, unknown>): AdFilterInput {
  return {
    startDate: props['start_date'],
    endDate: props['end_date'],
    live: props['live'],
    displayFormats: props['display_format'],
    publisherPlatforms: props['publisher_platform'],
    niches: props['niches'],
    marketTargets: props['market_target'],
    languages: props['languages'],
  };
}

function sortOrderProp({ allowed = SORT_ORDERS }: { allowed?: string[] } = {}) {
  return Property.StaticDropdown({ displayName: 'Order', description: `${allowed.join(', ')}. Default ${allowed[0]}.`, required: false, options: { options: options(allowed) } });
}

type AdFilterInput = {
  startDate?: unknown;
  endDate?: unknown;
  live?: unknown;
  displayFormats?: unknown;
  publisherPlatforms?: unknown;
  niches?: unknown;
  marketTargets?: unknown;
  languages?: unknown;
  videoDurationMin?: unknown;
  videoDurationMax?: unknown;
  runningDurationMinDays?: unknown;
  runningDurationMaxDays?: unknown;
};

const foreplayProps = {
  SORT_ORDERS,
  SWIPEFILE_ORDERS,
  BRAND_ORDERS,
  DISPLAY_FORMATS,
  PUBLISHER_PLATFORMS,
  NICHES,
  MARKET_TARGETS,
  optionalText,
  requiredText,
  foreplayId,
  pageId,
  parseInteger,
  parseBoolean,
  apiDate,
  dayOnly,
  stringList,
  enumValue,
  adFilterQuery,
  aiAdFilterProps,
  aiAdFilterInput,
  humanAdFilterProps,
  humanAdFilterInput,
  sortOrderProp,
};

export { foreplayProps };
export type { AdFilterInput };
