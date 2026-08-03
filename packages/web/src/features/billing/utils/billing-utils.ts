import { isNil } from '@activepieces/core-utils';
import { PlanName, PlatformBillingInformation } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';

const DAILY_RESET_INTERVAL = 'day';
const MINUTES_PER_HOUR = 60;

function isPaidPlan(planName: string | null | undefined): planName is string {
  return !isNil(planName) && planName !== PlanName.FREE;
}

function percentUsed({ used, total }: PercentUsedParams): number {
  if (isNil(total) || total <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((used / total) * 100));
}

function resolveSeatCap(info: PlatformBillingInformation): SeatCap {
  const limit = info.plan.usersLimit ?? null;
  const scheduledCap = info.plan.scheduledUsersLimit ?? null;
  const capBinds =
    !isNil(scheduledCap) && (isNil(limit) || scheduledCap < limit);
  return {
    capBinds,
    scheduledCap,
    effectiveLimit: capBinds ? scheduledCap : limit,
    scheduledPlanName: info.scheduledPlanName ?? t('Free'),
    switchDate: dayjs(info.cancelAt).format('MMM D, YYYY'),
  };
}

function scheduledCapNotice(info: PlatformBillingInformation): string {
  const { scheduledPlanName, switchDate } = resolveSeatCap(info);
  return t(
    "You're downgrading to the {plan} plan on {date} — the seat limit shown comes from your scheduled plan.",
    { plan: scheduledPlanName, date: switchDate },
  );
}

function resolveCreditsReset({
  dateFormat,
  ...params
}: CreditsResetParams & { dateFormat: string }): CreditsResetLine | null {
  const reset = resolveResetMoment(params);
  if (isNil(reset)) {
    return null;
  }
  if (reset.resetsDaily) {
    return { label: t('Resets in'), value: formatTimeUntil(reset.at) };
  }
  return { label: t('Resets on'), value: dayjs(reset.at).format(dateFormat) };
}

function resolveResetMoment({
  creditsNextResetAt,
  creditsResetInterval,
  nextBillingDate,
  isPaid,
}: CreditsResetParams): { at: string; resetsDaily: boolean } | null {
  if (!isNil(creditsNextResetAt)) {
    return {
      at: creditsNextResetAt,
      resetsDaily: isDailyReset({ creditsResetInterval, isPaid }),
    };
  }
  if (isPaid) {
    return isNil(nextBillingDate)
      ? null
      : { at: nextBillingDate, resetsDaily: false };
  }
  return {
    at: dayjs().add(1, 'day').startOf('day').toISOString(),
    resetsDaily: true,
  };
}

function isDailyReset({
  creditsResetInterval,
  isPaid,
}: {
  creditsResetInterval: string | null | undefined;
  isPaid: boolean;
}): boolean {
  if (isNil(creditsResetInterval)) {
    return !isPaid;
  }
  return creditsResetInterval === DAILY_RESET_INTERVAL;
}

function formatTimeUntil(value: string): string {
  const minutes = Math.max(0, dayjs(value).diff(dayjs(), 'minute'));
  if (minutes < 1) {
    return t('less than a minute');
  }
  if (minutes < MINUTES_PER_HOUR) {
    return t('{count, plural, =1 {1 minute} other {# minutes}}', {
      count: minutes,
    });
  }
  return t('{count, plural, =1 {1 hour} other {# hours}}', {
    count: Math.floor(minutes / MINUTES_PER_HOUR),
  });
}

export const billingUtils = {
  isPaidPlan,
  percentUsed,
  resolveSeatCap,
  scheduledCapNotice,
  resolveCreditsReset,
};

export type PercentUsedParams = {
  used: number;
  total: number | null | undefined;
};

export type SeatCap = {
  capBinds: boolean;
  scheduledCap: number | null;
  effectiveLimit: number | null;
  scheduledPlanName: string;
  switchDate: string;
};

export type CreditsResetParams = {
  creditsNextResetAt: string | null | undefined;
  creditsResetInterval: string | null | undefined;
  nextBillingDate: string | null | undefined;
  isPaid: boolean;
};

export type CreditsResetLine = {
  label: string;
  value: string;
};
