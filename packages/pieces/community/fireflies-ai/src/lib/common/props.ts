import { Property } from '@activepieces/pieces-framework';

function optionalText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const text = value.trim();
    return text === '' ? undefined : text;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function requireText({ value, label, maxLength }: { value: unknown; label: string; maxLength?: number }): string {
  const text = optionalText(value);
  if (text === undefined) {
    throw new Error(`${label} is required.`);
  }
  if (maxLength !== undefined && text.length > maxLength) {
    throw new Error(`${label} must be at most ${maxLength} characters (got ${text.length}).`);
  }
  return text;
}

function optionalInteger({ value, label, min, max }: { value: unknown; label: string; min: number; max: number }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.trim()) : Number.NaN;
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new Error(`${label} must be a whole number between ${min} and ${max}.`);
  }
  return number;
}

function optionalSeconds({ value, label }: { value: unknown; label: string }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.trim()) : Number.NaN;
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${label} must be a number of seconds, 0 or more.`);
  }
  return number;
}

function textList({ value, label, max }: { value: unknown; label: string; max: number }): string[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  const raw: unknown[] = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [value];
  const items = raw.map((item) => optionalText(item)).filter((item): item is string => item !== undefined);
  const unique = [...new Set(items)];
  if (unique.length > max) {
    throw new Error(`${label} accepts at most ${max} values (got ${unique.length}).`);
  }
  return unique;
}

function emailList({ value, label, max }: { value: unknown; label: string; max: number }): string[] {
  const emails = textList({ value, label, max });
  const invalid = emails.filter((email) => !EMAIL_PATTERN.test(email));
  if (invalid.length > 0) {
    throw new Error(`${label} has invalid email addresses: ${invalid.slice(0, 5).join(', ')}.`);
  }
  return emails;
}

function oneOf({ value, label, allowed }: { value: unknown; label: string; allowed: readonly string[] }): string | undefined {
  const text = optionalText(value);
  if (text === undefined) {
    return undefined;
  }
  const match = allowed.find((option) => option === text.toLowerCase());
  if (match === undefined) {
    throw new Error(`${label} must be one of: ${allowed.join(', ')} (got "${text.slice(0, 50)}").`);
  }
  return match;
}

function allOf({ value, label, allowed }: { value: unknown; label: string; allowed: readonly string[] }): string[] {
  return textList({ value, label, max: allowed.length }).map((item) => {
    const match = oneOf({ value: item, label, allowed });
    if (match === undefined) {
      throw new Error(`${label} must be one of: ${allowed.join(', ')}.`);
    }
    return match;
  });
}

function yesNo({ value, label }: { value: unknown; label: string }): boolean | undefined {
  const choice = oneOf({ value, label, allowed: ['yes', 'no'] });
  return choice === undefined ? undefined : choice === 'yes';
}

function strictIsoDate({ value, label, dateOnlyAs }: { value: unknown; label: string; dateOnlyAs: 'start' | 'end' | 'noon' }): StrictDate | undefined {
  const text = optionalText(value);
  if (text === undefined) {
    return undefined;
  }
  const match = ISO_PATTERN.exec(text);
  if (!match) {
    throw new Error(`${label} must be an ISO 8601 date like 2026-03-15 or 2026-03-15T14:30:00Z (got "${text.slice(0, 50)}").`);
  }
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, fractionText, offsetText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    throw new Error(`${label} is not a real calendar date (got "${text.slice(0, 50)}").`);
  }
  if (hourText === undefined) {
    const time = dateOnlyAs === 'start' ? 'T00:00:00.000Z' : dateOnlyAs === 'end' ? 'T23:59:59.999Z' : 'T12:00:00.000Z';
    const iso = `${yearText}-${monthText}-${dayText}${time}`;
    return { iso, epochMs: Date.parse(iso), dateOnly: true };
  }
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = secondText === undefined ? 0 : Number(secondText);
  if (hour > 23 || minute > 59 || second > 59) {
    throw new Error(`${label} has an invalid time of day (got "${text.slice(0, 50)}").`);
  }
  const offset = offsetText === undefined || offsetText === 'Z' || offsetText === 'z' ? 'Z' : normalizeOffset(offsetText);
  const normalized = `${yearText}-${monthText}-${dayText}T${hourText}:${minuteText}:${secondText ?? '00'}${fractionText ?? ''}${offset}`;
  const epochMs = Date.parse(normalized);
  if (Number.isNaN(epochMs)) {
    throw new Error(`${label} could not be parsed as a date and time (got "${text.slice(0, 50)}").`);
  }
  return { iso: new Date(epochMs).toISOString(), epochMs, dateOnly: false };
}

function normalizeOffset(offset: string): string {
  const digits = offset.replace(':', '');
  const hours = Number(digits.slice(1, 3));
  const minutes = Number(digits.slice(3, 5));
  if (hours > 14 || minutes > 59) {
    throw new Error(`The time zone offset "${offset}" is invalid.`);
  }
  return `${digits.slice(0, 3)}:${digits.slice(3, 5)}`;
}

function meetingId({ description }: { description: string }) {
  return Property.ShortText({
    displayName: 'Meeting ID',
    description,
    required: true,
  });
}

export const firefliesInput = {
  optionalText,
  requireText,
  optionalInteger,
  optionalSeconds,
  textList,
  emailList,
  oneOf,
  allOf,
  yesNo,
  strictIsoDate,
};

export const firefliesProps = { meetingId };

export const PRIVACY_VALUES = ['link', 'owner', 'participants', 'participatingteammates', 'teammatesandparticipants', 'teammates'] as const;

export const SEARCH_SCOPES = ['title', 'sentences', 'all'] as const;

export const BITE_PRIVACIES = ['public', 'team', 'participants'] as const;

export const YES_NO_OPTIONS = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(\.\d{1,3})?)?(Z|z|[+-]\d{2}:?\d{2})?)?$/;

export type StrictDate = { iso: string; epochMs: number; dateOnly: boolean };
