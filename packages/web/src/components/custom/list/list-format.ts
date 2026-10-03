import dayjs from 'dayjs';
import i18next, { t } from 'i18next';

function shortDate(value: string | Date): string {
  const date = dayjs(value);
  const sameYear = date.isSame(dayjs(), 'year');
  return Intl.DateTimeFormat(i18next.language, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(date.toDate());
}

function dateTime(value: string | Date): string {
  return Intl.DateTimeFormat(i18next.language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(dayjs(value).toDate());
}

function relativeDate(value: string | Date | null | undefined): string {
  if (value === null || value === undefined) {
    return t('Never');
  }
  const date = dayjs(value);
  const now = dayjs();
  if (Math.abs(date.diff(now, 'second')) < 60) {
    return t('Just now');
  }
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', date.diff(now, 'year')],
    ['month', date.diff(now, 'month')],
    ['week', date.diff(now, 'week')],
    ['day', date.diff(now, 'day')],
    ['hour', date.diff(now, 'hour')],
    ['minute', date.diff(now, 'minute')],
  ];
  const [unit, amount] = units.find(([, diff]) => diff !== 0) ?? ['minute', 0];
  const text = new Intl.RelativeTimeFormat(i18next.language, {
    numeric: 'auto',
  }).format(amount, unit);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function initialsOf(name: string): string {
  const words = name
    .replace(/@.*$/, '')
    .split(/[\s._-]+/)
    .filter((word) => word.length > 0);
  if (words.length === 0) {
    return '?';
  }
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

function count(value: number): string {
  return Intl.NumberFormat(i18next.language).format(value);
}

export const listFormat = {
  shortDate,
  dateTime,
  relativeDate,
  initialsOf,
  count,
};
