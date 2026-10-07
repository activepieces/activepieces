const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/;
const URL_PREFIX_PATTERN = /^https?:\/\/[^/\s?#@]+(?:\/[^\s?#]*)?$/i;
const DOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?)+$/i;
const LANGUAGE_PATTERN = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const PACIFIC_TIME_ZONE = 'America/Los_Angeles';
const DAY_MS = 86_400_000;
const MAX_LAST_N_DAYS = 500;
const HUMAN_MAX_ROW_LIMIT = 25_000;
const MAX_START_ROW = 10_000_000;

function text(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return '';
}

function siteUrl({ value, label = 'Site URL' }: { value: unknown; label?: string }): string {
  const raw = text(value);
  if (raw.length === 0) {
    throw new Error(`${label} is required. Use the property exactly as List Sites shows it, e.g. "https://www.example.com/" or "sc-domain:example.com".`);
  }
  if (raw.toLowerCase().startsWith('sc-domain:')) {
    const domain = raw.slice('sc-domain:'.length).trim();
    if (!DOMAIN_PATTERN.test(domain)) {
      throw new Error(`${label} "${raw.slice(0, 120)}" is not a valid domain property. Use "sc-domain:" followed by the bare domain, e.g. "sc-domain:example.com".`);
    }
    return `sc-domain:${domain}`;
  }
  if (!URL_PREFIX_PATTERN.test(raw)) {
    throw new Error(`${label} "${raw.slice(0, 120)}" is not a Search Console property. Use a URL-prefix property such as "https://www.example.com/" or a domain property such as "sc-domain:example.com".`);
  }
  return raw.endsWith('/') ? raw : `${raw}/`;
}

function absoluteUrl({ value, label }: { value: unknown; label: string }): string {
  const raw = text(value);
  if (raw.length === 0) {
    throw new Error(`${label} is required.`);
  }
  const parsed = parseUrl(raw);
  if (!parsed || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || parsed.username !== '' || parsed.password !== '') {
    throw new Error(`${label} "${raw.slice(0, 200)}" must be a full http(s) URL, e.g. "https://www.example.com/sitemap.xml".`);
  }
  return raw;
}

function urlInProperty({ value, label, site }: { value: unknown; label: string; site: string }): string {
  const url = absoluteUrl({ value, label });
  if (!belongsToProperty({ url, site })) {
    throw new Error(`${label} "${url.slice(0, 200)}" is not part of the property ${site}. ${site.startsWith('sc-domain:') ? `It must be on ${site.slice('sc-domain:'.length)} or one of its subdomains.` : `It must start with ${site}.`}`);
  }
  return url;
}

function belongsToProperty({ url, site }: { url: string; site: string }): boolean {
  if (site.startsWith('sc-domain:')) {
    const domain = site.slice('sc-domain:'.length).toLowerCase();
    const host = parseUrl(url)?.hostname.toLowerCase() ?? '';
    return host === domain || host.endsWith(`.${domain}`);
  }
  const prefix = parseUrl(site);
  const target = parseUrl(url);
  if (!prefix || !target) {
    return false;
  }
  return prefix.protocol === target.protocol && prefix.host.toLowerCase() === target.host.toLowerCase() && target.pathname.startsWith(prefix.pathname);
}

function languageCode({ value }: { value: unknown }): string | undefined {
  const raw = text(value);
  if (raw.length === 0) {
    return undefined;
  }
  if (!LANGUAGE_PATTERN.test(raw)) {
    throw new Error(`Language Code "${raw.slice(0, 40)}" is not a BCP-47 code. Use a code such as "en-US", "de" or "pt-BR".`);
  }
  return raw;
}

function date({ value, label }: { value: unknown; label: string }): string | undefined {
  const raw = text(value);
  if (raw.length === 0) {
    return undefined;
  }
  const match = DATE_PATTERN.exec(raw);
  if (!match) {
    throw new Error(`${label} "${raw.slice(0, 40)}" is not a date. Use YYYY-MM-DD, e.g. "2026-09-01".`);
  }
  const [, year, month, day] = match;
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (parsed.getUTCFullYear() !== Number(year) || parsed.getUTCMonth() !== Number(month) - 1 || parsed.getUTCDate() !== Number(day)) {
    throw new Error(`${label} "${raw.slice(0, 40)}" is not a real calendar date.`);
  }
  return `${year}-${month}-${day}`;
}

function dateRange({ startDate, endDate, lastNDays, today = pacificToday() }: { startDate: unknown; endDate: unknown; lastNDays?: unknown; today?: string }): { startDate: string; endDate: string } {
  const start = date({ value: startDate, label: 'Start Date' });
  const end = date({ value: endDate, label: 'End Date' });
  const days = optionalInteger({ value: lastNDays, label: 'Last N Days', min: 1, max: MAX_LAST_N_DAYS });
  if (days !== undefined && (start !== undefined || end !== undefined)) {
    throw new Error('Use either Last N Days or Start Date/End Date, not both.');
  }
  const yesterday = shiftDate({ value: today, days: -1 });
  if (start === undefined && end !== undefined) {
    throw new Error('Start Date is required when End Date is set.');
  }
  if (start === undefined) {
    const span = days ?? 28;
    return { startDate: shiftDate({ value: yesterday, days: -(span - 1) }), endDate: yesterday };
  }
  const resolvedEnd = end ?? yesterday;
  if (start > resolvedEnd) {
    throw new Error(`Start Date ${start} is after End Date ${resolvedEnd}.`);
  }
  return { startDate: start, endDate: resolvedEnd };
}

function requiredDateRange({ startDate, endDate }: { startDate: unknown; endDate: unknown }): { startDate: string; endDate: string } {
  const start = date({ value: startDate, label: 'Start Date' });
  const end = date({ value: endDate, label: 'End Date' });
  if (start === undefined || end === undefined) {
    throw new Error('Start Date and End Date are required (YYYY-MM-DD, Pacific Time).');
  }
  if (start > end) {
    throw new Error(`Start Date ${start} is after End Date ${end}.`);
  }
  return { startDate: start, endDate: end };
}

function pacificToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: PACIFIC_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

function shiftDate({ value, days }: { value: string; days: number }): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day) + days * DAY_MS).toISOString().slice(0, 10);
}

function optionalInteger({ value, label, min, max }: { value: unknown; label: string; min: number; max: number }): number | undefined {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return undefined;
  }
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && /^-?\d+$/.test(value.trim()) ? Number(value.trim()) : Number.NaN;
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be a whole number from ${min.toLocaleString('en-US')} to ${max.toLocaleString('en-US')}.`);
  }
  return parsed;
}

function dimensions({ value }: { value: unknown }): Dimension[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  const items = Array.isArray(value) ? value : [value];
  const names = items.map((item) => text(item)).filter((item) => item.length > 0);
  const resolved = names.map((name) => {
    const match = DIMENSIONS.find((dimension) => dimension.toLowerCase() === name.toLowerCase());
    if (!match) {
      throw new Error(`Dimension "${name.slice(0, 40)}" is not supported. Use any of: ${DIMENSIONS.join(', ')}.`);
    }
    return match;
  });
  const unique = new Set(resolved);
  if (unique.size !== resolved.length) {
    throw new Error('Each dimension can be used only once.');
  }
  return resolved;
}

function filters({ value }: { value: unknown }): AnalyticsFilter[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error('Filters must be a list of { dimension, operator, expression } items.');
  }
  return value.map((item, index) => {
    const position = `Filter ${index + 1}`;
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`${position} must have a dimension, an operator and an expression.`);
    }
    const dimension = FILTER_DIMENSIONS.find((name) => name.toLowerCase() === text(Reflect.get(item, 'dimension')).toLowerCase());
    if (!dimension) {
      throw new Error(`${position}: dimension must be one of ${FILTER_DIMENSIONS.join(', ')}.`);
    }
    const operator = OPERATORS.find((name) => name.toLowerCase() === text(Reflect.get(item, 'operator')).toLowerCase());
    if (!operator) {
      throw new Error(`${position}: operator must be one of ${OPERATORS.join(', ')}.`);
    }
    const expression = text(Reflect.get(item, 'expression'));
    if (expression.length === 0) {
      throw new Error(`${position}: expression is empty.`);
    }
    return { dimension, operator, expression: dimension === 'device' ? expression.toUpperCase() : expression };
  });
}

function choice<T extends string>({ value, options, label }: { value: unknown; options: readonly T[]; label: string }): T | undefined {
  const raw = text(value);
  if (raw.length === 0) {
    return undefined;
  }
  const match = options.find((option) => option.toLowerCase() === raw.toLowerCase());
  if (!match) {
    throw new Error(`${label} "${raw.slice(0, 40)}" is not supported. Use one of: ${options.join(', ')}.`);
  }
  return match;
}

function analyticsQuery({
  startDate,
  endDate,
  dimensions: dimensionList,
  searchType,
  filters: filterList,
  aggregationType,
  dataState,
  rowLimit,
  startRow,
}: {
  startDate: string;
  endDate: string;
  dimensions: Dimension[];
  searchType: unknown;
  filters: AnalyticsFilter[];
  aggregationType: unknown;
  dataState: unknown;
  rowLimit: number | undefined;
  startRow: number | undefined;
}): AnalyticsQuery {
  const type = choice({ value: searchType, options: SEARCH_TYPES, label: 'Search Type' });
  const aggregation = choice({ value: aggregationType, options: AGGREGATION_TYPES, label: 'Aggregation Type' });
  const requestedState = choice({ value: dataState, options: DATA_STATES, label: 'Data State' });
  const usesHour = dimensionList.includes('hour');
  if (usesHour && requestedState !== undefined && requestedState !== 'hourly_all') {
    throw new Error('The "hour" dimension needs Data State "hourly_all" (or leave Data State empty). Hourly data covers only the last few days.');
  }
  const state = usesHour ? 'hourly_all' : requestedState;
  const usesPage = dimensionList.includes('page') || filterList.some((filter) => filter.dimension === 'page');
  if (aggregation === 'byProperty' && usesPage) {
    throw new Error('Aggregation Type "byProperty" cannot be combined with the "page" dimension or a page filter. Use "auto" or "byPage".');
  }
  const usesQuery = dimensionList.includes('query') || filterList.some((filter) => filter.dimension === 'query');
  if ((type === 'discover' || type === 'googleNews') && usesQuery) {
    throw new Error(`Search Type "${type}" has no search queries. Remove the "query" dimension and query filters.`);
  }
  if (aggregation === 'byNewsShowcasePanel' && type !== 'discover' && type !== 'googleNews') {
    throw new Error('Aggregation Type "byNewsShowcasePanel" works only with Search Type "discover" or "googleNews".');
  }
  return {
    startDate,
    endDate,
    ...(dimensionList.length > 0 ? { dimensions: dimensionList } : {}),
    ...(type ? { type } : {}),
    ...(filterList.length > 0 ? { dimensionFilterGroups: [{ groupType: 'and', filters: filterList }] } : {}),
    ...(aggregation ? { aggregationType: aggregation } : {}),
    ...(state ? { dataState: state } : {}),
    ...(rowLimit !== undefined ? { rowLimit } : {}),
    ...(startRow !== undefined ? { startRow } : {}),
  };
}

function parseUrl(value: string): URL | undefined {
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

export const DIMENSIONS = ['date', 'hour', 'query', 'page', 'country', 'device', 'searchAppearance'] as const;
export const FILTER_DIMENSIONS = ['query', 'page', 'country', 'device', 'searchAppearance'] as const;
export const OPERATORS = ['equals', 'notEquals', 'contains', 'notContains', 'includingRegex', 'excludingRegex'] as const;
export const SEARCH_TYPES = ['web', 'image', 'video', 'news', 'discover', 'googleNews'] as const;
export const AGGREGATION_TYPES = ['auto', 'byPage', 'byProperty', 'byNewsShowcasePanel'] as const;
export const DATA_STATES = ['final', 'all', 'hourly_all'] as const;

export const gscInputs = {
  siteUrl,
  absoluteUrl,
  urlInProperty,
  belongsToProperty,
  languageCode,
  date,
  dateRange,
  requiredDateRange,
  pacificToday,
  optionalInteger,
  dimensions,
  filters,
  choice,
  analyticsQuery,
  HUMAN_MAX_ROW_LIMIT,
  MAX_START_ROW,
  MAX_LAST_N_DAYS,
};

export type Dimension = (typeof DIMENSIONS)[number];
export type AnalyticsFilter = { dimension: (typeof FILTER_DIMENSIONS)[number]; operator: (typeof OPERATORS)[number]; expression: string };
export type AnalyticsQuery = {
  startDate: string;
  endDate: string;
  dimensions?: Dimension[];
  type?: (typeof SEARCH_TYPES)[number];
  dimensionFilterGroups?: { groupType: 'and'; filters: AnalyticsFilter[] }[];
  aggregationType?: (typeof AGGREGATION_TYPES)[number];
  dataState?: (typeof DATA_STATES)[number];
  rowLimit?: number;
  startRow?: number;
};
