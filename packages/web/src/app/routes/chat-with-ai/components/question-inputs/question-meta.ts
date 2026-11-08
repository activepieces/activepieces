import { differenceInCalendarDays, format } from 'date-fns';
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
      const range = t('{min} to {max}', {
        min: question.min,
        max: question.max,
      });
      return `${sliderDisplay({ value: current, unit: question.unit })} · ${range}`;
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
  return `${format(from, 'MMM d')} – ${format(to, 'MMM d')} · ${t(
    '{count, plural, =1 {1 day} other {# days}}',
    { count },
  )}`;
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
  return (
    question.defaultValue ?? Math.round((question.min + question.max) / 2)
  );
}

function rangeDisplay(range: DateRange | undefined): string {
  if (!range?.from) return '';
  if (!range.to) return format(range.from, 'MMM d, yyyy');
  return `${format(range.from, 'MMM d')} – ${format(range.to, 'MMM d, yyyy')}`;
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

export const questionMetaUtils = {
  hint,
  footerSummary,
  sliderDisplay,
  sliderStart,
  rangeDisplay,
  isDateRange,
};
