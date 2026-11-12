const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const PERIODS = ['today', 'yesterday', 'last7', 'last30', 'week', 'month', 'lastmonth', 'total', 'custom'];
const LEGACY_PERIODS: Record<string, string> = { thisMonth: 'month', lastMonth: 'lastmonth' };

function ttlSecondsToDeleteAt({ seconds, now }: { seconds: number; now: number }): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error('Time to Live must be a positive number of seconds.');
  }
  const deleteAt = now + seconds * 1000;
  if (deleteAt - now < SEVEN_DAYS_MS) {
    throw new Error('Time to Live must be at least 604800 seconds (7 days): Short.io only accepts a deletion time at least one week ahead.');
  }
  return new Date(deleteAt).toISOString();
}

function deleteAtToIso({ value, now }: { value: string; now: number }): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) {
    throw new Error(`Delete At must be an ISO 8601 date-time (got "${value}").`);
  }
  if (time - now < SEVEN_DAYS_MS) {
    throw new Error('Delete At must be at least 7 days in the future: Short.io only accepts a deletion time at least one week ahead.');
  }
  return new Date(time).toISOString();
}

function toIsoDateTime({ value, label }: { value: string; label: string }): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) {
    throw new Error(`${label} must be an ISO 8601 date-time (got "${value}").`);
  }
  return new Date(time).toISOString();
}

function toApiDate({ value, label }: { value: string; label: string }): string {
  const trimmed = value.trim();
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  if (!match || Number.isNaN(Date.parse(match[1]))) {
    throw new Error(`${label} must be a date like 2026-01-31 (got "${value}").`);
  }
  return match[1];
}

function normalizePeriod(value: unknown): string {
  const text = typeof value === 'string' && value ? value : 'last30';
  const period = LEGACY_PERIODS[text] ?? text;
  if (!PERIODS.includes(period)) {
    throw new Error(`Period must be one of: ${PERIODS.join(', ')}.`);
  }
  return period;
}

function validateTimezone(value: string | undefined): string | undefined {
  const tz = value?.trim();
  if (!tz) {
    return undefined;
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
  } catch {
    throw new Error(`Unknown timezone "${tz}". Use an IANA name like UTC, America/New_York or Europe/London.`);
  }
  return tz;
}

function statsRange({ period, startDate, endDate, ignoreDatesForPresets = false }: {
  period: unknown;
  startDate?: string;
  endDate?: string;
  ignoreDatesForPresets?: boolean;
}): Record<string, string> {
  const normalized = normalizePeriod(period);
  if (normalized !== 'custom') {
    if (!ignoreDatesForPresets && (startDate || endDate)) {
      throw new Error('Start and end dates are only used when the period is "custom".');
    }
    return { period: normalized };
  }
  if (!startDate || !endDate) {
    throw new Error('Start date and end date are both required when the period is "custom".');
  }
  const start = toApiDate({ value: startDate, label: 'Start date' });
  const end = toApiDate({ value: endDate, label: 'End date' });
  if (start > end) {
    throw new Error('Start date must not be after end date.');
  }
  return { period: normalized, startDate: start, endDate: end };
}

function optionalNumber({ value, label, min, max }: { value: unknown; label: string; min?: number; max?: number }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`${label} must be a number.`);
  }
  if ((min !== undefined && num < min) || (max !== undefined && num > max)) {
    throw new Error(`${label} must be between ${min ?? '-∞'} and ${max ?? '∞'}.`);
  }
  return num;
}

function stringList(value: unknown): string[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  const items = Array.isArray(value) ? value : String(value).split(',');
  return items.map((item) => (typeof item === 'string' ? item.trim() : typeof item === 'number' ? String(item) : '')).filter((item) => item !== '');
}

function compact(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}

export const shortIoValues = {
  ttlSecondsToDeleteAt,
  deleteAtToIso,
  toIsoDateTime,
  toApiDate,
  normalizePeriod,
  validateTimezone,
  statsRange,
  optionalNumber,
  stringList,
  compact,
  PERIODS,
};
