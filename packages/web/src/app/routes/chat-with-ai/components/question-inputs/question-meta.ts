import { differenceInCalendarDays } from 'date-fns';
import { t } from 'i18next';
import { DateRange } from 'react-day-picker';

import { MultiQuestion } from '@/features/chat/lib/chat-store-types';

function hint({
  question,
  value,
}: {
  question: MultiQuestion;
  value: unknown;
}): string | null {
  switch (question.type) {
    case 'choice':
      return question.options.length === 0 ? t('type it') : t('pick one');
    case 'multi_choice':
      return t('pick any');
    case 'date':
      return t('pick a date');
    case 'date_range':
      return t('pick a start and an end');
    case 'time': {
      const zone = localTimeZoneName();
      return zone ? t('your time zone, {zone}', { zone }) : null;
    }
    case 'slider': {
      const current = typeof value === 'number' ? value : sliderStart(question);
      return t('{value} · {min} to {max}', {
        value: sliderDisplay({ value: current, unit: question.unit }),
        min: question.min,
        max: question.max,
      });
    }
    case 'color':
      return t('pick one');
  }
}

function footerSummary({
  question,
  value,
}: {
  question: MultiQuestion;
  value: unknown;
}): string | null {
  if (question.type !== 'date_range' || !isDateRange(value)) return null;
  const { from, to } = value;
  if (!from || !to) return null;
  const count = differenceInCalendarDays(to, from) + 1;
  return t('{range} · {count, plural, =1 {1 day} other {# days}}', {
    range: SHORT_DATE.formatRange(from, to),
    count,
  });
}

function dateDisplay(date: Date | undefined): string {
  return date ? FULL_DATE.format(date) : '';
}

function defaultAnswer(
  question: MultiQuestion,
): { display: string; value: unknown } | null {
  if (question.type === 'slider') {
    const initial = sliderStart(question);
    return {
      display: sliderDisplay({ value: initial, unit: question.unit }),
      value: initial,
    };
  }
  if (question.type === 'color') {
    const initial = question.presets?.[0] ?? accentHex();
    return initial ? { display: initial, value: initial } : null;
  }
  return null;
}

function accentHex(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue('--accent-9')
    .trim();
  return HEX_PATTERN.test(raw) ? raw : null;
}

function sliderDisplay({
  value,
  unit,
}: {
  value: number;
  unit?: string;
}): string {
  return unit ? `${value} ${unit}` : `${value}`;
}

function sliderStart(
  question: Extract<MultiQuestion, { type: 'slider' }>,
): number {
  return question.defaultValue ?? Math.round((question.min + question.max) / 2);
}

function rangeDisplay(range: DateRange | undefined): string {
  if (!range?.from) return '';
  if (!range.to) return FULL_DATE.format(range.from);
  return FULL_DATE.formatRange(range.from, range.to);
}

function isDateRange(value: unknown): value is DateRange {
  return !!value && typeof value === 'object' && 'from' in value;
}

function localTimeZoneName(): string | null {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!zone) return null;
  const city = zone.split('/').pop() ?? zone;
  return city.replace(/_/g, ' ');
}

const FULL_DATE = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const SHORT_DATE = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

export const questionMetaUtils = {
  hint,
  footerSummary,
  sliderDisplay,
  sliderStart,
  rangeDisplay,
  dateDisplay,
  defaultAnswer,
  isDateRange,
};
