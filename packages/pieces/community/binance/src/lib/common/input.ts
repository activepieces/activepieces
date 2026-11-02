function symbol({ value, fieldName = 'Symbol' }: { value: unknown; fieldName?: string }): string {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(`${fieldName} is required, for example BTCUSDT.`);
  }
  const normalized = String(value).replace(/[\s/]+/g, '').toUpperCase();
  if (normalized === '') {
    throw new Error(`${fieldName} is required, for example BTCUSDT.`);
  }
  if (normalized.length > MAX_SYMBOL_LENGTH) {
    throw new Error(
      `${fieldName} "${normalized.slice(0, 60)}" is longer than ${MAX_SYMBOL_LENGTH} characters, so it cannot be a Binance symbol.`
    );
  }
  return normalized;
}

function symbols({ value }: { value: unknown }): string[] {
  const items: unknown[] = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  const parts = items.flatMap((item) => splitSymbolItem({ item }));
  const unique = [...new Set(parts.map((part) => symbol({ value: part })))];
  if (unique.length === 0) {
    throw new Error('Add at least one symbol, for example BTCUSDT.');
  }
  if (unique.length > MAX_SYMBOLS_PER_CALL) {
    throw new Error(
      `This action takes at most ${MAX_SYMBOLS_PER_CALL} symbols per call; ${unique.length} were given. Split the list across several steps.`
    );
  }
  return unique;
}

function limit({ value, min, max, defaultValue, fieldName = 'Limit' }: LimitParams): number {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const parsed =
    typeof value === 'number' ? value : typeof value === 'string' && /^\s*-?\d+\s*$/.test(value) ? Number(value) : NaN;
  if (!Number.isInteger(parsed)) {
    throw new Error(`${fieldName} must be a whole number between ${min} and ${max}.`);
  }
  if (parsed < min || parsed > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}; got ${parsed}.`);
  }
  return parsed;
}

function epochMs({ value, fieldName }: { value: unknown; fieldName: string }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = parseEpochMs({ value });
  if (parsed === undefined) {
    throw new Error(`${fieldName} must be a date such as 2026-10-01T09:00:00Z, or epoch milliseconds.`);
  }
  if (parsed < MIN_EPOCH_MS) {
    throw new Error(
      `${fieldName} resolves to ${new Date(parsed).toISOString()}, which is before 2001 and earlier than any Binance data. Pass a date such as 2026-10-01T09:00:00Z.`
    );
  }
  return parsed;
}

function windowSize({ value, defaultValue }: { value: unknown; defaultValue: string }): string {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const match = typeof value === 'string' ? /^(\d{1,2})([mhd])$/.exec(value.trim()) : null;
  const amount = match ? Number(match[1]) : 0;
  if (!match || amount < 1 || amount > WINDOW_UNIT_MAX[match[2]]) {
    throw new Error(
      `Window size "${String(value)}" is not valid. Use 1m to 59m, 1h to 23h, or 1d to 7d (for example 15m, 4h, 7d).`
    );
  }
  return `${amount}${match[2]}`;
}

function timeZone({ value }: { value: unknown }): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const text = typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
  const match = /^([+-]?)(\d{1,2})(?::(\d{2}))?$/.exec(text);
  if (match) {
    const sign = match[1] === '-' ? -1 : 1;
    const minutes = match[3] === undefined ? 0 : Number(match[3]);
    const offset = sign * (Number(match[2]) * 60 + minutes);
    if (minutes < 60 && offset >= -12 * 60 && offset <= 14 * 60) {
      return text;
    }
  }
  throw new Error(
    `Time zone "${String(value)}" is not valid. Use an offset from UTC between -12:00 and +14:00, such as 0, 8, -5, 05:45 or -03:30.`
  );
}

function klineInterval({ value }: { value: unknown }): string {
  const text = typeof value === 'string' ? value.trim() : '';
  const match = KLINE_INTERVALS.find((interval) => interval === text);
  if (match === undefined) {
    throw new Error(
      `Interval "${String(value)}" is not valid. Use one of: ${KLINE_INTERVALS.join(', ')} (case-sensitive; 1m is one minute, 1M is one month).`
    );
  }
  return match;
}

function parseEpochMs({ value }: { value: unknown }): number | undefined {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : undefined;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function splitSymbolItem({ item }: { item: unknown }): string[] {
  if (item === undefined || item === null) {
    return [];
  }
  if (typeof item !== 'string' && typeof item !== 'number') {
    throw new Error('Symbols must be text values such as BTCUSDT.');
  }
  return String(item)
    .split(/[,;\n]/)
    .filter((part) => part.trim() !== '');
}

const MAX_SYMBOL_LENGTH = 50;
const MAX_SYMBOLS_PER_CALL = 100;
const MIN_EPOCH_MS = 1_000_000_000_000;
const WINDOW_UNIT_MAX: Record<string, number> = { m: 59, h: 23, d: 7 };
const KLINE_INTERVALS = ['1s', '1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];

export const binanceInput = {
  symbol,
  symbols,
  limit,
  epochMs,
  windowSize,
  timeZone,
  klineInterval,
  MAX_SYMBOLS_PER_CALL,
  KLINE_INTERVALS,
};

type LimitParams = {
  value: unknown;
  min: number;
  max: number;
  defaultValue: number;
  fieldName?: string;
};
