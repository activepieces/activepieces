import { isNil } from '@activepieces/core-utils';
import dayjs from 'dayjs';

function calendarDaysBetween({
  from,
  to,
}: {
  from: Date | string | number;
  to: Date | string | number;
}): number {
  return dayjs(to).startOf('day').diff(dayjs(from).startOf('day'), 'day');
}

function activeTrialTiming({
  startedAt,
  endsAt,
  now,
}: {
  startedAt: Date | string | null | undefined;
  endsAt: Date | string;
  now: number;
}): ActiveTrialTiming {
  const daysLeft = Math.max(0, calendarDaysBetween({ from: now, to: endsAt }));
  const daysSinceStart = isNil(startedAt)
    ? null
    : Math.max(0, calendarDaysBetween({ from: startedAt, to: now }));
  return {
    startedAt: isNil(startedAt) ? null : dayjs(startedAt).toDate(),
    endsAt: dayjs(endsAt).toDate(),
    daysLeft,
    endsToday: daysLeft === 0,
    ending: daysLeft <= ENDING_PHASE_DAYS,
    justStarted: isNil(daysSinceStart)
      ? daysLeft >= TRIAL_DAYS - JUST_STARTED_DAYS
      : daysSinceStart < JUST_STARTED_DAYS,
  };
}

function nextBoundary({
  end,
  now,
}: {
  end: number;
  now: number;
}): number | null {
  const candidates = [end, dayjs(now).add(1, 'day').startOf('day').valueOf()];
  const upcoming = candidates.filter(
    (moment) => moment > now && moment <= end + HOUR_MS,
  );
  if (upcoming.length === 0) {
    return null;
  }
  return Math.min(...upcoming);
}

export const enterpriseTrialTime = {
  calendarDaysBetween,
  activeTrialTiming,
  nextBoundary,
};

export const TRIAL_DAYS = 7;
const ENDING_PHASE_DAYS = 1;
const JUST_STARTED_DAYS = 2;
const HOUR_MS = 60 * 60 * 1000;

export type ActiveTrialTiming = {
  startedAt: Date | null;
  endsAt: Date;
  daysLeft: number;
  endsToday: boolean;
  ending: boolean;
  justStarted: boolean;
};
