const MAX_MINOR = BigInt(Number.MAX_SAFE_INTEGER);

function exponent(currency: string): number {
  try {
    const digits = new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits;
    return typeof digits === 'number' ? digits : 2;
  } catch {
    return 2;
  }
}

function normalizeCurrency(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }
  const code = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) {
    throw new Error(`Currency "${value.slice(0, 20)}" is not a 3-letter ISO code such as USD.`);
  }
  return code;
}

function toMinor({ amount, currency, label, allowZero = false }: { amount: unknown; currency: string; label: string; allowZero?: boolean }): number {
  const text = typeof amount === 'number' ? numberText(amount) : typeof amount === 'string' ? amount.trim() : '';
  if (text.length === 0) {
    throw new Error(`${label} is required, for example 12.50.`);
  }
  const match = /^(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match) {
    throw new Error(`${label} "${text.slice(0, 30)}" is not a valid amount. Use digits and an optional decimal point, for example 12.50 (no currency symbol, no minus sign).`);
  }
  const places = exponent(currency);
  const fraction = match[2] ?? '';
  if (fraction.length > places) {
    const trimmed = fraction.replace(/0+$/, '');
    if (trimmed.length > places) {
      throw new Error(`${label} ${text} has more decimal places than ${currency} allows (${places}).`);
    }
  }
  const minorText = `${match[1]}${fraction.padEnd(places, '0').slice(0, places)}`;
  const minor = BigInt(minorText);
  if (minor > MAX_MINOR) {
    throw new Error(`${label} ${text} is too large.`);
  }
  if (minor === BigInt(0) && !allowZero) {
    throw new Error(`${label} must be greater than zero.`);
  }
  return Number(minor);
}

function format({ minor, currency }: { minor: number; currency: string }): string {
  const places = exponent(currency);
  const negative = minor < 0;
  const digits = String(Math.abs(Math.trunc(minor)));
  if (places === 0) {
    return `${negative ? '-' : ''}${digits}`;
  }
  const padded = digits.padStart(places + 1, '0');
  return `${negative ? '-' : ''}${padded.slice(0, -places)}.${padded.slice(-places)}`;
}

function numberText(value: number): string {
  if (!Number.isFinite(value)) {
    return 'invalid';
  }
  const text = String(value);
  if (/e/i.test(text)) {
    return value.toFixed(20).replace(/0+$/, '').replace(/\.$/, '');
  }
  return text;
}

function quantity({ value, label, allowZero = false, wholeOnly = false }: { value: unknown; label: string; allowZero?: boolean; wholeOnly?: boolean }): string {
  const text = typeof value === 'number' ? numberText(value) : typeof value === 'string' ? value.trim() : '';
  if (wholeOnly && !/^\d{1,9}$/.test(text)) {
    throw new Error(`${label} "${String(value ?? '').slice(0, 30)}" must be a whole number such as 1 or 3.`);
  }
  if (!/^\d{1,12}(\.\d{1,5})?$/.test(text)) {
    throw new Error(`${label} "${String(value ?? '').slice(0, 30)}" is not a valid quantity. Use a positive number with up to 5 decimals, for example 2 or 1.5.`);
  }
  const normalized = text.includes('.') ? text.replace(/0+$/, '').replace(/\.$/, '') : text;
  const stripped = normalized.replace(/^0+(?=\d)/, '');
  if (!allowZero && /^0(\.0*)?$/.test(stripped)) {
    throw new Error(`${label} must be greater than zero.`);
  }
  return stripped;
}

export const squareMoney = { exponent, normalizeCurrency, toMinor, format, quantity };
