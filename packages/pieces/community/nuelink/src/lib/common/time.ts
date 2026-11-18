import { nuelinkClient } from './client';

export const nuelinkTime = {
  parseInstant,
  assertTimeZone,
  formatInZone,
  toBrandSchedule,
  toUtcFilter,
  scheduleForBrand,
  parseZonedInstant,
};

function parseInstant({ value, label }: { value: unknown; label: string }): Date {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length === 0) {
    throw new Error(`${label} is empty. Use an ISO 8601 date and time, for example 2026-10-12T09:00:00Z.`);
  }
  const normalized = NAIVE_DATE.test(text) ? `${text}T00:00:00Z` : NAIVE_DATE_TIME.test(text) ? `${text.replace(' ', 'T')}Z` : text;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} is not a valid date and time: "${text}". Use ISO 8601, for example 2026-10-12T09:00:00Z.`);
  }
  return date;
}

function assertTimeZone({ timeZone, brandTitle }: { timeZone: string | null; brandTitle: string }): string {
  if (timeZone === null || timeZone.trim().length === 0) {
    throw new Error(
      `The Nuelink brand "${brandTitle}" has no timezone set, so the scheduled time cannot be converted to brand time. Set the brand's timezone in Nuelink and try again.`
    );
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timeZone.trim() });
  } catch {
    throw new Error(`The Nuelink brand "${brandTitle}" has a timezone this step does not recognise ("${timeZone}"). Set an IANA timezone such as Europe/London in Nuelink.`);
  }
  return timeZone.trim();
}

function formatInZone({ date, timeZone }: { date: Date; timeZone: string }): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '00';
  return `${part('year')}-${part('month')}-${part('day')} ${part('hour')}:${part('minute')}:${part('second')}`;
}

function toBrandSchedule({ value, timeZone, now, label }: { value: unknown; timeZone: string; now: number; label: string }): BrandSchedule {
  const date = assertLead({ value, label, now });
  const local = formatInZone({ date, timeZone });
  const hourBefore = formatInZone({ date: new Date(date.getTime() - HOUR_MS), timeZone });
  const hourAfter = formatInZone({ date: new Date(date.getTime() + HOUR_MS), timeZone });
  if (hourBefore === local || hourAfter === local) {
    throw new Error(
      `${label} (${date.toISOString()}) falls in the hour that repeats when ${timeZone} leaves daylight saving time, so Nuelink could publish it an hour off. Pick a time outside that hour.`
    );
  }
  return { local, utc: date.toISOString() };
}

function toUtcFilter({ value, label }: { value: unknown; label: string }): string {
  return parseInstant({ value, label }).toISOString().slice(0, 19).replace('T', ' ');
}

async function scheduleForBrand({ apiKey, brandId, value, label }: { apiKey: string; brandId: string; value: unknown; label: string }): Promise<BrandSchedule & { timeZone: string }> {
  assertLead({ value, label, now: Date.now() });
  const brand = await nuelinkClient.findBrand({ apiKey, brandId });
  const timeZone = assertTimeZone({ timeZone: brand.timezone, brandTitle: brand.title });
  return { ...toBrandSchedule({ value, timeZone, now: Date.now(), label }), timeZone };
}

function parseZonedInstant({ value, label }: { value: unknown; label: string }): Date {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length > 0 && !EXPLICIT_ZONE.test(text)) {
    throw new Error(`${label} "${text.slice(0, 40)}" has no timezone. Send an ISO-8601 time with an offset, e.g. 2026-10-12T09:00:00+03:00.`);
  }
  return parseInstant({ value, label });
}

function assertLead({ value, label, now }: { value: unknown; label: string; now: number }): Date {
  const date = parseZonedInstant({ value, label });
  if (date.getTime() - now < MIN_SCHEDULE_LEAD_MS) {
    throw new Error(`${label} must be at least 10 minutes in the future (Nuelink rule). It was ${date.toISOString()}.`);
  }
  return date;
}

const NAIVE_DATE = /^\d{4}-\d{2}-\d{2}$/;
const NAIVE_DATE_TIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?$/;
const EXPLICIT_ZONE = /T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})$/i;
const MIN_SCHEDULE_LEAD_MS = 10 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

type BrandSchedule = {
  local: string;
  utc: string;
};
