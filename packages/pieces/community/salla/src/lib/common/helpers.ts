import { HttpMethod } from '@activepieces/pieces-common';
import { SallaAuth, sallaApi } from './client';

function toIsoDate(value: unknown): string | undefined {
  if (sallaApi.isRecord(value)) {
    const date = value['date'];
    const timezone = typeof value['timezone'] === 'string' ? value['timezone'] : STORE_TIMEZONE;
    return typeof date === 'string' ? localDateTimeToIso({ local: date, timezone }) : undefined;
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }
  const trimmed = value.trim();
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(trimmed) && trimmed.includes('T')) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }
  if (/^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?)?$/.test(trimmed)) {
    return localDateTimeToIso({ local: trimmed, timezone: STORE_TIMEZONE });
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function localDateTimeToIso({ local, timezone }: { local: string; timezone: string }): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?)?$/.exec(local.trim());
  if (!match) {
    return undefined;
  }
  const [, year, month, day, hour = '0', minute = '0', second = '0', fraction = '0'] = match;
  const millis = Number(`0.${fraction}`) * 1000;
  const asUtc = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second), Math.round(millis));
  if (Number.isNaN(asUtc) || !isRealDateTime({ instant: asUtc, year, month, day, hour, minute, second })) {
    return undefined;
  }
  const offset = timezoneOffsetMs({ timezone, instant: asUtc });
  if (offset === undefined) {
    return undefined;
  }
  const firstGuess = asUtc - offset;
  const correctedOffset = timezoneOffsetMs({ timezone, instant: firstGuess }) ?? offset;
  return new Date(asUtc - correctedOffset).toISOString();
}

function isRealDateTime({
  instant,
  year,
  month,
  day,
  hour = '0',
  minute = '0',
  second = '0',
}: {
  instant: number;
  year: string;
  month: string;
  day: string;
  hour?: string;
  minute?: string;
  second?: string;
}): boolean {
  const check = new Date(instant);
  return (
    check.getUTCFullYear() === Number(year) &&
    check.getUTCMonth() === Number(month) - 1 &&
    check.getUTCDate() === Number(day) &&
    check.getUTCHours() === Number(hour) &&
    check.getUTCMinutes() === Number(minute) &&
    check.getUTCSeconds() === Number(second)
  );
}

function timezoneOffsetMs({ timezone, instant }: { timezone: string; instant: number }): number | undefined {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const parts: Record<string, number> = {};
    for (const part of formatter.formatToParts(new Date(instant))) {
      if (part.type !== 'literal') {
        parts[part.type] = Number(part.value);
      }
    }
    const zoned = Date.UTC(parts['year'], parts['month'] - 1, parts['day'], parts['hour'], parts['minute'], parts['second']);
    const flooredInstant = Math.floor(instant / 1000) * 1000;
    return zoned - flooredInstant;
  } catch {
    return undefined;
  }
}

function wallClockFromDateTimeProp(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const text = value.trim();
  if (text.length === 0) {
    return undefined;
  }
  const utc = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?Z$/i.exec(text);
  if (!utc) {
    return text;
  }
  const [, date, hour, minute, second = '00'] = utc;
  const time = `${hour}:${minute}:${second}`;
  return time === '00:00:00' ? date : `${date} ${time}`;
}

function toStoreDate(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null || value.trim().length === 0) {
    return undefined;
  }
  const trimmed = value.trim();
  const invalid = new Error(`"${value}" is not a valid date. Use YYYY-MM-DD, for example 2026-11-01.`);
  const localMatch = /^(\d{4})-(\d{2})-(\d{2})(?:[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?$/.exec(trimmed);
  if (localMatch) {
    const [, year, month, day] = localMatch;
    if (!isRealDateTime({ instant: Date.UTC(Number(year), Number(month) - 1, Number(day)), year, month, day })) {
      throw invalid;
    }
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw invalid;
  }
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: STORE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(parsed);
}

function amountOf(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const normalized = normalizeDigits(value).replace(/,/g, '').trim();
    if (normalized.length === 0) {
      return undefined;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (sallaApi.isRecord(value)) {
    return amountOf(value['amount']);
  }
  return undefined;
}

function normalizeDigits(value: string): string {
  return value
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/\u066b/g, '.')
    .replace(/\u066c/g, '');
}

function withOrderExtras(order: unknown): Record<string, unknown> {
  if (!sallaApi.isRecord(order)) {
    return {};
  }
  const status = sallaApi.isRecord(order['status']) ? order['status'] : {};
  const customer = sallaApi.isRecord(order['customer']) ? order['customer'] : {};
  const amounts = sallaApi.isRecord(order['amounts']) ? order['amounts'] : {};
  const total = order['total'] ?? amounts['total'];
  const customerName =
    textOrNull(customer['full_name']) ??
    textOrNull(`${textOrNull(customer['first_name']) ?? ''} ${textOrNull(customer['last_name']) ?? ''}`);
  const mobile = textOrNull(customer['mobile']);
  const flat: Record<string, unknown> = {
    status_name: textOrNull(status['name']),
    status_slug: textOrNull(status['slug']),
    total_amount: amountOf(total) ?? null,
    currency: textOrNull(sallaApi.isRecord(total) ? total['currency'] : undefined) ?? textOrNull(order['currency']),
    payment_method: textOrNull(order['payment_method']),
    customer_id: customer['id'] ?? null,
    customer_name: customerName,
    customer_email: textOrNull(customer['email']),
    customer_mobile: mobile ? `${textOrNull(customer['mobile_code']) ?? ''}${mobile}` : null,
    date_iso: toIsoDate(order['date']) ?? null,
    updated_at_iso: toIsoDate(order['updated_at']) ?? null,
  };
  return { ...flat, ...order };
}

function textOrNull(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function triState(value: unknown): boolean | undefined {
  if (value === 'yes' || value === true) {
    return true;
  }
  if (value === 'no' || value === false) {
    return false;
  }
  return undefined;
}

function optionalNumber({ value, label }: { value: unknown; label: string }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'string' && value.trim().length === 0) {
    return undefined;
  }
  const parsed = typeof value === 'string' ? Number(normalizeDigits(value).trim()) : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} must be a number, but got "${String(value)}".`);
  }
  return parsed;
}

function requireId({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? normalizeDigits(value).trim() : '';
  if (!/^\d+$/.test(text)) {
    throw new Error(`${label} must be a numeric Salla ID, for example 2116149737. Got "${String(value ?? '')}".`);
  }
  return text;
}

function compact(value: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined || entry === null || entry === '') {
      continue;
    }
    if (Array.isArray(entry)) {
      if (entry.length > 0) {
        result[key] = entry;
      }
      continue;
    }
    if (sallaApi.isRecord(entry)) {
      const nested = compact(entry);
      if (Object.keys(nested).length > 0) {
        result[key] = nested;
      }
      continue;
    }
    result[key] = entry;
  }
  return result;
}

function toStringList(value: unknown): string[] {
  const parsed = parseJsonArray(value);
  if (parsed !== undefined) {
    return toStringList(parsed);
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'number' ? String(entry) : typeof entry === 'string' ? entry.trim() : ''))
      .filter((entry) => entry.length > 0);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  if (typeof value === 'number') {
    return [String(value)];
  }
  return [];
}

function parseJsonArray(value: unknown): unknown[] | undefined {
  if (typeof value !== 'string' || !value.trim().startsWith('[')) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function toRecordList({ value, label }: { value: unknown; label: string }): unknown[] {
  const parsed = parseJsonArray(value);
  if (parsed !== undefined) {
    return parsed;
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined || value === null || value === '') {
    return [];
  }
  throw new Error(`${label} must be a list, for example [{"identifier_type":"sku","identifier":"TSHIRT-RED-M","quantity":2}].`);
}

function withKeys({ record, keys }: { record: unknown; keys: string[] }): Record<string, unknown> {
  const source = sallaApi.isRecord(record) ? record : {};
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    result[key] = source[key] ?? null;
  }
  return { ...result, ...source };
}

async function listOrderStatuses({ auth }: { auth: SallaAuth }): Promise<SallaOrderStatus[]> {
  const response = await sallaApi.request<unknown[]>({ auth, method: HttpMethod.GET, path: '/orders/statuses' });
  const data = Array.isArray(response.body.data) ? response.body.data : [];
  const statuses: SallaOrderStatus[] = [];
  for (const entry of data) {
    if (!sallaApi.isRecord(entry)) {
      continue;
    }
    const id = entry['id'];
    if (typeof id !== 'number' && typeof id !== 'string') {
      continue;
    }
    statuses.push({
      id: String(id),
      name: typeof entry['name'] === 'string' ? entry['name'] : String(id),
      slug: typeof entry['slug'] === 'string' ? entry['slug'] : undefined,
      type: typeof entry['type'] === 'string' ? entry['type'] : undefined,
      isActive: entry['is_active'] !== false,
      parentName: readParentName(entry['parent']),
      parentId: readLinkedId(entry['parent']),
      originalId: readLinkedId(entry['original']),
    });
  }
  return statuses;
}

function readParentName(parent: unknown): string | undefined {
  if (sallaApi.isRecord(parent) && typeof parent['name'] === 'string') {
    return parent['name'];
  }
  return undefined;
}

function readLinkedId(linked: unknown): string | undefined {
  if (!sallaApi.isRecord(linked)) {
    return undefined;
  }
  const id = linked['id'];
  return typeof id === 'number' || typeof id === 'string' ? String(id) : undefined;
}

function isCancelStatus({ value, statuses }: { value: string | number; statuses: SallaOrderStatus[] }): boolean {
  const text = normalizeDigits(String(value)).trim().toLowerCase();
  if (CANCEL_SLUGS.includes(text)) {
    return true;
  }
  if (!/^\d+$/.test(text)) {
    return false;
  }
  const matches = statuses.filter((status) => status.id === text || status.originalId === text);
  return matches.some((match) => isCancelRow({ row: match, statuses }));
}

function isCancelRow({ row, statuses }: { row: SallaOrderStatus; statuses: SallaOrderStatus[] }): boolean {
  if (hasCancelSlug(row)) {
    return true;
  }
  const linkedIds = [row.parentId, row.originalId].filter((id): id is string => typeof id === 'string');
  return statuses.some((status) => linkedIds.includes(status.id) && hasCancelSlug(status));
}

function hasCancelSlug(status: SallaOrderStatus): boolean {
  return !!status.slug && CANCEL_SLUGS.includes(status.slug.toLowerCase());
}

function resolveStatusTarget({
  value,
  statuses,
}: {
  value: string | number;
  statuses: SallaOrderStatus[];
}): { slug: string } | { status_id: number } {
  const text = normalizeDigits(String(value)).trim();
  if (text.length === 0) {
    throw new Error('Pick the new order status.');
  }
  if (/^\d+$/.test(text)) {
    const match = statuses.find((status) => status.id === text);
    if (match && match.type === 'original' && match.slug) {
      return { slug: match.slug };
    }
    return { status_id: Number(text) };
  }
  const slug = text.toLowerCase();
  if (slug === 'cancelled') {
    return { slug: 'canceled' };
  }
  if (!ORDER_STATUS_SLUGS.includes(slug)) {
    throw new Error(
      `"${text}" is not a Salla order status. Use a status ID from List Order Statuses, or one of: ${ORDER_STATUS_SLUGS.join(', ')}.`,
    );
  }
  return { slug };
}

const STORE_TIMEZONE = 'Asia/Riyadh';

const CANCEL_SLUG = 'canceled';
const CANCEL_SLUGS = [CANCEL_SLUG, 'cancelled'];

const ORDER_STATUS_SLUGS = [
  'payment_pending',
  'waiting_for_payment_confirmation',
  'payment_failed',
  'in_progress',
  'under_review',
  'completed',
  'delivering',
  'delivered',
  'shipped',
  'canceled',
  'restored',
  'restoring',
];

export const sallaUtils = {
  toIsoDate,
  toStoreDate,
  wallClockFromDateTimeProp,
  amountOf,
  normalizeDigits,
  withOrderExtras,
  triState,
  optionalNumber,
  requireId,
  compact,
  toStringList,
  parseJsonArray,
  toRecordList,
  withKeys,
  listOrderStatuses,
  resolveStatusTarget,
  isCancelStatus,
};

export { STORE_TIMEZONE, ORDER_STATUS_SLUGS, CANCEL_SLUG };

type SallaOrderStatus = {
  id: string;
  name: string;
  slug?: string;
  type?: string;
  isActive: boolean;
  parentName?: string;
  parentId?: string;
  originalId?: string;
};

export type { SallaOrderStatus };
