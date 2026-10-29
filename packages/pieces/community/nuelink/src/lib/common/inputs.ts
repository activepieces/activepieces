import { nuelinkClient } from './client';

export const nuelinkInputs = {
  paging,
  oneOf,
  optionalText,
  requiredText,
  optionalId,
  isChecked,
  optionalInteger,
  stringList,
  httpUrl,
  mediaItems,
  hasValue,
  queueSlot,
  queueSlots,
  bodyIds,
  poll,
};

function paging({ page, perPage }: { page: unknown; perPage: unknown }): { page: number; perPage: number } {
  const pageNumber = optionalInteger({ value: page, label: 'Page', min: 1, max: 100000 }) ?? 1;
  const size = optionalInteger({ value: perPage, label: 'Results per Page', min: 1, max: 100 }) ?? 25;
  return { page: pageNumber, perPage: size };
}

function oneOf<T extends string>({ value, label, allowed }: { value: unknown; label: string; allowed: readonly T[] }): T | undefined {
  if (!hasValue({ value })) {
    return undefined;
  }
  const text = typeof value === 'string' ? value.trim().toUpperCase() : '';
  const match = allowed.find((option) => option.toUpperCase() === text);
  if (match === undefined) {
    throw new Error(`${label} must be one of: ${allowed.join(', ')}.`);
  }
  return match;
}

function optionalText({ value, label, max }: { value: unknown; label: string; max: number }): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const text = typeof value === 'string' ? value : typeof value === 'number' ? String(value) : undefined;
  if (text === undefined) {
    throw new Error(`${label} must be text.`);
  }
  if (text.trim().length === 0) {
    return undefined;
  }
  if (text.length > max) {
    throw new Error(`${label} is ${text.length} characters long; Nuelink allows at most ${max}.`);
  }
  return text;
}

function requiredText({ value, label, max }: { value: unknown; label: string; max: number }): string {
  const text = optionalText({ value, label, max });
  if (text === undefined) {
    throw new Error(`${label} is required.`);
  }
  return text;
}

function optionalId({ value, label }: { value: unknown; label: string }): string | undefined {
  return hasValue({ value }) ? nuelinkClient.numericId({ value, label }) : undefined;
}

function isChecked({ value }: { value: unknown }): boolean {
  return value === true || value === 'true';
}

function optionalInteger({ value, label, min, max }: { value: unknown; label: string; min: number; max: number }): number | undefined {
  if (!hasValue({ value })) {
    return undefined;
  }
  const number = typeof value === 'number' ? value : typeof value === 'string' && /^-?\d+$/.test(value.trim()) ? Number(value.trim()) : Number.NaN;
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  }
  return number;
}

function stringList({ value, label, maxItems, maxLength }: { value: unknown; label: string; maxItems: number; maxLength: number }): string[] {
  if (!hasValue({ value })) {
    return [];
  }
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? [value] : undefined;
  if (raw === undefined) {
    throw new Error(`${label} must be a list of text values.`);
  }
  const items = raw
    .map((item) => (typeof item === 'string' ? item.trim() : typeof item === 'number' ? String(item) : ''))
    .filter((item) => item.length > 0);
  if (items.length > maxItems) {
    throw new Error(`${label} has ${items.length} entries; at most ${maxItems} are allowed.`);
  }
  const tooLong = items.find((item) => item.length > maxLength);
  if (tooLong !== undefined) {
    throw new Error(`${label} entries must be at most ${maxLength} characters long.`);
  }
  return items;
}

function httpUrl({ value, label }: { value: string; label: string }): string {
  const text = value.trim();
  if (text.length > MAX_URL_LENGTH) {
    throw new Error(`${label} is longer than ${MAX_URL_LENGTH} characters.`);
  }
  try {
    const url = new URL(text);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('bad scheme');
    }
  } catch {
    throw new Error(`${label} must be a full http(s) URL, for example https://example.com/image.jpg. Got "${text.slice(0, 100)}".`);
  }
  return text;
}

function mediaItems({ value }: { value: unknown }): MediaItem[] {
  const entries = stringList({ value, label: 'Media', maxItems: MAX_MEDIA_PER_POST, maxLength: MAX_URL_LENGTH });
  return entries.map((entry) => {
    if (/^https?:\/\//i.test(entry)) {
      return { url: httpUrl({ value: entry, label: 'Media URL' }) };
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(entry) || entry.startsWith('//')) {
      throw new Error(`Media "${entry.slice(0, 100)}" is neither an http(s) URL nor a Nuelink media ID.`);
    }
    return { id: entry };
  });
}

function hasValue({ value }: { value: unknown }): boolean {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return true;
}

function queueSlot({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  const match = /^(mon|tue|wed|thu|fri|sat|sun) ([01]\d|2[0-3]):([0-5]\d)$/i.exec(text);
  if (match === null) {
    throw new Error(`${label} must be a weekday and 24-hour brand-local time like "Tue 09:00". Got "${text.slice(0, 40)}".`);
  }
  const day = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
  return `${day} ${match[2]}:${match[3]}`;
}

function queueSlots({ value, label }: { value: unknown; label: string }): string[] {
  const entries = stringList({ value, label, maxItems: MAX_QUEUE_SLOTS, maxLength: 40 });
  return [...new Set(entries.map((entry) => queueSlot({ value: entry, label })))];
}

function bodyIds({ value, label, maxItems }: { value: unknown; label: string; maxItems: number }): number[] {
  if (!hasValue({ value })) {
    return [];
  }
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [value];
  const ids = raw.filter((item) => hasValue({ value: item })).map((item) => nuelinkClient.bodyId({ value: item, label }));
  const unique = [...new Set(ids)];
  if (unique.length > maxItems) {
    throw new Error(`${label} has ${unique.length} distinct IDs; at most ${maxItems} are allowed.`);
  }
  return unique;
}

function poll({ question, options, period, correctOptionIndex, explanation }: { question: unknown; options: unknown; period: unknown; correctOptionIndex: unknown; explanation: unknown }): PollInput | undefined {
  const anySet = [question, options, period, correctOptionIndex, explanation].some((value) => hasValue({ value }));
  if (!anySet) {
    return undefined;
  }
  const text = optionalText({ value: question, label: 'Poll Question', max: 280 });
  const choices = stringList({ value: options, label: 'Poll Options', maxItems: 4, maxLength: 30 });
  const duration = oneOf({ value: period, label: 'Poll Duration', allowed: POLL_PERIODS.map((item) => item.toUpperCase()) });
  if (text === undefined || choices.length < 2 || duration === undefined) {
    throw new Error('A poll needs Poll Question, 2 to 4 Poll Options and Poll Duration (1d, 3d or 7d) together.');
  }
  const correct = optionalInteger({ value: correctOptionIndex, label: 'Poll Correct Option Index', min: 0, max: choices.length - 1 });
  const note = optionalText({ value: explanation, label: 'Poll Explanation', max: 512 });
  return {
    question: text,
    options: choices,
    period: duration.toLowerCase(),
    ...(correct === undefined ? {} : { correctOptionIndex: correct }),
    ...(note === undefined ? {} : { explanation: note }),
  };
}

const MAX_URL_LENGTH = 1000;
const MAX_MEDIA_PER_POST = 10;
const MAX_QUEUE_SLOTS = 70;
const POLL_PERIODS = ['1d', '3d', '7d'] as const;

type MediaItem = { url: string } | { id: string };

export type PollInput = { question: string; options: string[]; period: string; correctOptionIndex?: number; explanation?: string };
