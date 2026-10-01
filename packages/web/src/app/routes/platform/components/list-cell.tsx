import dayjs from 'dayjs';
import i18next, { t } from 'i18next';
import * as React from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { cn } from '@/lib/utils';

function NameCell({
  media,
  title,
  sub,
  className,
}: {
  media?: React.ReactNode;
  title: string;
  sub?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      {media}
      <div className="flex min-w-0 items-baseline gap-2">
        <TextWithTooltip tooltipMessage={title}>
          <span className="block max-w-full min-w-0 shrink-0 truncate font-medium text-gray-12">
            {title}
          </span>
        </TextWithTooltip>
        {sub && (
          <span className="min-w-0 truncate text-xs text-gray-11">{sub}</span>
        )}
      </div>
    </div>
  );
}

function InitialsTile({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden
      style={style}
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-md bg-gray-3 text-xs font-medium text-gray-11',
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

function MutedCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('block truncate text-gray-11', className)}>
      {children}
    </span>
  );
}

function NumberCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'block text-right whitespace-nowrap text-gray-11 tabular-nums',
        className,
      )}
    >
      {children}
    </span>
  );
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
  const format = new Intl.RelativeTimeFormat(i18next.language, {
    numeric: 'auto',
  });
  const seconds = date.diff(now, 'second');
  if (Math.abs(seconds) < 60) {
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
  const [unit, amount] = units.find(([, diff]) => diff !== 0) ?? [
    'minute',
    0,
  ];
  const text = format.format(amount, unit);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const listFormat = { shortDate, dateTime, relativeDate, initialsOf };

export { NameCell, InitialsTile, MutedCell, NumberCell };
