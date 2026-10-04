import { isNil } from '@activepieces/core-utils';
import {
  AUDIT_LOG_RETENTION_BACKLOG_GRACE_DAYS,
  AUDIT_LOG_RETENTION_MIN_DAYS,
} from '@activepieces/shared';
import dayjs from 'dayjs';

function buildOptions({
  savedDays,
  ceiling,
}: {
  savedDays: number | null;
  ceiling: number | null;
}): (number | null)[] {
  const presets = PRESET_DAYS.filter((days) =>
    isWithinCeiling({ days, ceiling }),
  );
  const custom =
    !isNil(savedDays) &&
    !PRESET_DAYS.includes(savedDays) &&
    savedDays >= AUDIT_LOG_RETENTION_MIN_DAYS &&
    isWithinCeiling({ days: savedDays, ceiling })
      ? [savedDays]
      : [];
  return [...[...presets, ...custom].sort((a, b) => a - b), null];
}

function initialSelection({
  savedDays,
  ceiling,
}: {
  savedDays: number | null;
  ceiling: number | null;
}): number | null {
  return isWithinCeiling({ days: savedDays, ceiling }) ? savedDays : null;
}

function effectiveDays({
  days,
  ceiling,
}: {
  days: number | null;
  ceiling: number | null;
}): number | null {
  if (isNil(days)) {
    return ceiling;
  }
  return isNil(ceiling) ? days : Math.min(days, ceiling);
}

function deletesEvents({
  next,
  current,
}: {
  next: number | null;
  current: number | null;
}): boolean {
  if (isNil(next)) {
    return false;
  }
  return isNil(current) || next < current;
}

function cutoffDate({ days, now }: { days: number; now: Date }): Date {
  return dayjs(now).subtract(days, 'day').toDate();
}

function isCleanupPending({
  oldestEventCreated,
  days,
  now,
}: {
  oldestEventCreated: string | null;
  days: number | null;
  now: Date;
}): boolean {
  if (isNil(oldestEventCreated) || isNil(days)) {
    return false;
  }
  return dayjs(oldestEventCreated).isBefore(
    cutoffDate({ days: days + AUDIT_LOG_RETENTION_BACKLOG_GRACE_DAYS, now }),
  );
}

function isWithinCeiling({
  days,
  ceiling,
}: {
  days: number | null;
  ceiling: number | null;
}): boolean {
  return !isNil(days) && (isNil(ceiling) || days <= ceiling);
}

export const auditLogRetentionUtils = {
  buildOptions,
  initialSelection,
  effectiveDays,
  deletesEvents,
  cutoffDate,
  isCleanupPending,
};

const PRESET_DAYS = [30, 90, 180, 365];
