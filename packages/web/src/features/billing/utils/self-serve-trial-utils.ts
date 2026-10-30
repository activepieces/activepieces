import { isNil } from '@activepieces/core-utils';
import { SelfServeTrialDates } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';

function calendarDaysBetween({
  from,
  to,
}: {
  from: Date | string | number;
  to: Date | string | number;
}): number {
  return dayjs(to).startOf('day').diff(dayjs(from).startOf('day'), 'day');
}

function isRunning(
  trial: SelfServeTrialDates | undefined,
): trial is SelfServeTrialDates {
  return !isNil(trial) && dayjs(trial.endsAt).isAfter(dayjs());
}

function hasEnded(
  trial: SelfServeTrialDates | undefined,
): trial is SelfServeTrialDates {
  return !isNil(trial) && !dayjs(trial.endsAt).isAfter(dayjs());
}

function daysLeft(endsAt: string): number {
  return Math.max(0, calendarDaysBetween({ from: Date.now(), to: endsAt }));
}

function formatDate(date?: dayjs.ConfigType): string {
  return dayjs(date).format('MMM D');
}

function whenItEnds(endsAt: string): WhenItEnds {
  const end = dayjs(endsAt);
  return {
    day: endDay(daysLeft(endsAt)),
    time: end.format('h:mm A'),
    date: formatDate(endsAt),
  };
}

function endDay(days: number): EndDay {
  if (days === 0) {
    return EndDay.TODAY;
  }
  return days === 1 ? EndDay.TOMORROW : EndDay.LATER;
}

function daysLeftCopy(endsAt: string): string {
  return t(
    '{count, plural, =0 {last day} =1 {1 day left} other {# days left}}',
    { count: daysLeft(endsAt) },
  );
}

function trialEndSummary(endsAt: string): string {
  return t(
    'Every Enterprise plan feature is on until {day, select, today {today at {time}} tomorrow {tomorrow at {time}} other {{date}}}. Your credits are not affected.',
    whenItEnds(endsAt),
  );
}

export const selfServeTrialTime = {
  calendarDaysBetween,
  isRunning,
  hasEnded,
  daysLeft,
  formatDate,
  whenItEnds,
};

export const TRIAL_DAYS = 7;

export const selfServeTrialCopy = {
  daysLeftCopy,
  trialEndSummary,
};

type WhenItEnds = {
  day: EndDay;
  time: string;
  date: string;
};

enum EndDay {
  TODAY = 'today',
  TOMORROW = 'tomorrow',
  LATER = 'later',
}
