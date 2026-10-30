import { isNil } from '@activepieces/core-utils';
import {
  AUDIT_LOG_RETENTION_BACKLOG_GRACE_DAYS,
  AUDIT_LOG_RETENTION_MIN_DAYS,
} from '@activepieces/shared';
import { t } from 'i18next';

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
  return new Date(now.getTime() - days * DAY_MS);
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
  return (
    new Date(oldestEventCreated).getTime() <
    cutoffDate({
      days: days + AUDIT_LOG_RETENTION_BACKLOG_GRACE_DAYS,
      now,
    }).getTime()
  );
}

function formatChoice({
  days,
  ceiling,
}: {
  days: number | null;
  ceiling: number | null;
}): string {
  if (!isNil(days)) {
    return formatPeriod(days);
  }
  return isNil(ceiling)
    ? t('Forever')
    : t('Instance limit ({period})', { period: formatPeriod(ceiling) });
}

function formatPeriod(days: number | null): string {
  if (isNil(days)) {
    return t('Forever');
  }
  if (days === 180) {
    return t('6 months');
  }
  if (days === 365) {
    return t('1 year');
  }
  return t('retentionPeriodDays', { days });
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
  formatChoice,
  formatPeriod,
};

const PRESET_DAYS = [30, 90, 180, 365];
const DAY_MS = 24 * 60 * 60 * 1000;
