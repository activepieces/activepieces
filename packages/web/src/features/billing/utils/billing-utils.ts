import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  CreditsBillableFeature,
  PlanName,
  PlatformBillingInformation,
} from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';

import { formatUtils } from '@/lib/format-utils';

const DAILY_RESET_INTERVAL = 'day';
const MINUTES_PER_HOUR = 60;
const CREDITS_WARNING_PERCENT = 70;
const CREDITS_DANGER_PERCENT = 90;
const COMPACT_CREDITS_FROM = 1_000_000;

function isPaidPlan(planName: string | null | undefined): planName is string {
  return !isNil(planName) && planName !== PlanName.FREE;
}

function isYearlyPlan(info: IsYearlyPlanInfo): boolean {
  if (info.planInterval === 'one_off') {
    return info.creditsResetInterval === 'year';
  }
  return info.planInterval === 'year';
}

function percentUsed({ used, total }: PercentUsedParams): number {
  if (isNil(total) || total <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((used / total) * 100));
}

function creditsSeverity(percent: number): CreditsSeverity {
  if (percent >= CREDITS_DANGER_PERCENT) {
    return 'error';
  }
  if (percent >= CREDITS_WARNING_PERCENT) {
    return 'warning';
  }
  return 'default';
}

function formatCredits(credits: number): string {
  return credits >= COMPACT_CREDITS_FROM
    ? formatUtils.formatNumberCompact(credits)
    : formatUtils.formatNumber(credits);
}

function shouldShowCreditsAlert({
  edition,
  isEmbedded,
  isProjectRoute,
  isUnlimited,
  isBillingEnforced,
  severity,
  isDismissalActive,
}: ShouldShowCreditsAlertParams): boolean {
  if (isEmbedded || !isProjectRoute || edition === ApEdition.COMMUNITY) {
    return false;
  }
  if (isUnlimited || !isBillingEnforced || severity === 'default') {
    return false;
  }
  return severity === 'error' || !isDismissalActive;
}

function resolveCreditsAction({
  isPaid,
  info,
}: ResolveCreditsActionParams): CreditsAction {
  if (!isPaid) {
    return { kind: 'upgrade' };
  }
  if (isNil(info)) {
    return { kind: 'unknown' };
  }
  if (!isNil(info.trialEndsAt)) {
    return { kind: 'upgrade' };
  }
  return isNil(info.creditsFeature)
    ? { kind: 'unknown' }
    : { kind: 'auto-recharge', feature: info.creditsFeature };
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
    switchDate: dayjs(info.cancelAt).format(BILLING_DATE_FORMAT),
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
  isYearlyPlan,
  percentUsed,
  creditsSeverity,
  formatCredits,
  shouldShowCreditsAlert,
  resolveCreditsAction,
  resolveSeatCap,
  scheduledCapNotice,
  resolveCreditsReset,
};

export const BILLING_DATE_FORMAT = 'MMM D, YYYY';

export type IsYearlyPlanInfo = Pick<
  PlatformBillingInformation,
  'planInterval' | 'creditsResetInterval'
>;

export type CreditsSeverity = 'default' | 'warning' | 'error';

export type ShouldShowCreditsAlertParams = {
  edition: ApEdition | null | undefined;
  isEmbedded: boolean;
  isProjectRoute: boolean;
  isUnlimited: boolean;
  isBillingEnforced: boolean;
  severity: CreditsSeverity;
  isDismissalActive: boolean;
};

export type CreditsAction =
  | { kind: 'unknown' }
  | { kind: 'upgrade' }
  | { kind: 'auto-recharge'; feature: CreditsBillableFeature };

export type ResolveCreditsActionParams = {
  isPaid: boolean;
  info:
    | Pick<PlatformBillingInformation, 'trialEndsAt' | 'creditsFeature'>
    | undefined;
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
