import { isNil, tryCatchSync } from '@activepieces/core-utils';
import {
  ApEdition,
  CreditsBillableFeature,
  PlanName,
  PlatformBillingInformation,
  InvitationStatus,
  UserStatus,
} from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';

import { formatUtils } from '@/lib/format-utils';

import type { SelfServeTrial } from '../hooks/self-serve-trial-hooks';

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
  const wholeCredits = Math.floor(credits);
  return wholeCredits >= COMPACT_CREDITS_FROM
    ? formatUtils.formatNumberCompact(wholeCredits)
    : formatUtils.formatNumber(wholeCredits);
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
}: CreditsResetParams): { at: string; resetsDaily: boolean } | null {
  const at = creditsNextResetAt ?? nextBillingDate;
  if (isNil(at)) {
    return null;
  }
  return { at, resetsDaily: creditsResetInterval === DAILY_RESET_INTERVAL };
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

function daysLeftLabel(trial: SelfServeTrial): string {
  if (trial.endsToday) {
    return t('Ends today');
  }
  if (trial.ending) {
    return t('Ends tomorrow');
  }
  return t('{count, plural, =1 {1 day left} other {# days left}}', {
    count: trial.daysLeft,
  });
}

function cardStatus(trial: SelfServeTrial): string {
  if (trial.endsToday) {
    return t('last day');
  }
  return t('{count, plural, =1 {1 day left} other {# days left}}', {
    count: trial.ending ? 1 : trial.daysLeft,
  });
}

function sidebarDetail(trial: SelfServeTrial): string {
  const end = dayjs(trial.endsAt);
  if (trial.endsToday) {
    return t('Ends today at {time}', { time: end.format('h:mm A') });
  }
  if (trial.ending) {
    return t('Ends tomorrow at {time}', { time: end.format('h:mm A') });
  }
  return t(
    '{count, plural, =1 {1 day left} other {# days left}}, ends {date}',
    { count: trial.daysLeft, date: end.format('MMM D') },
  );
}

function endsSentence(trial: SelfServeTrial): string {
  const end = dayjs(trial.endsAt);
  const time = end.format('h:mm A');
  if (trial.endsToday) {
    return t('Your Enterprise plan trial ends today at {time}.', { time });
  }
  if (trial.ending) {
    return t('Your Enterprise plan trial ends tomorrow at {time}.', { time });
  }
  return t('Your Enterprise plan trial ends on {date}.', {
    date: end.format('MMM D'),
  });
}

function details(trial: SelfServeTrial): string {
  const end = dayjs(trial.endsAt);
  const plan = trial.basePlanName;
  if (trial.endsToday) {
    return t(
      'Every Enterprise plan feature is on until today at {time}. Then you are back on the {plan} plan. Your credits are not affected.',
      { time: end.format('h:mm A'), plan },
    );
  }
  if (trial.ending) {
    return t(
      'Every Enterprise plan feature is on until tomorrow at {time}. Then you are back on the {plan} plan. Your credits are not affected.',
      { time: end.format('h:mm A'), plan },
    );
  }
  return t(
    'Every Enterprise plan feature is on until {date}. Then you are back on the {plan} plan. Your credits are not affected.',
    { date: end.format('MMM D'), plan },
  );
}

function focusDialogItself(event: Event): void {
  event.preventDefault();
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.focus();
  }
}

function readLocalStorageFlag(key: string): boolean {
  const { data } = tryCatchSync(() => window.localStorage.getItem(key));
  return data === 'true';
}

function setLocalStorageFlag(key: string): void {
  tryCatchSync(() => window.localStorage.setItem(key, 'true'));
}

function trialStorageId({
  platformId,
  userId,
  endsAt,
}: TrialStorageIdParams): string {
  return `${platformId}-${userId ?? 'unknown'}-${
    endsAt?.toISOString() ?? 'unknown'
  }`;
}

function reservedSeats({
  users,
  invitations,
  now = new Date(),
}: {
  users: { email: string; status: UserStatus }[];
  invitations: {
    email: string;
    status: InvitationStatus;
    updated: string;
  }[];
  now?: Date;
}): number {
  const active = users.filter((user) => user.status === UserStatus.ACTIVE);
  const existingUserEmails = new Set(
    users.map((user) => user.email.toLowerCase()),
  );
  const cutoff = dayjs(now).subtract(INVITATION_RESERVATION_DAYS, 'day');
  const pending = new Set(
    invitations
      .filter(
        (invitation) =>
          RESERVING_STATUSES.includes(invitation.status) &&
          dayjs(invitation.updated).isAfter(cutoff),
      )
      .map((invitation) => invitation.email.toLowerCase())
      .filter((email) => !existingUserEmails.has(email)),
  );
  return active.length + pending.size;
}

export const seatUtils = { reservedSeats };

const INVITATION_RESERVATION_DAYS = 7;

const RESERVING_STATUSES = [
  InvitationStatus.PENDING,
  InvitationStatus.ACCEPTED,
];

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

export const selfServeTrialCopy = {
  daysLeftLabel,
  sidebarDetail,
  cardStatus,
  endsSentence,
  details,
};

export const selfServeTrialUi = {
  focusDialogItself,
  readLocalStorageFlag,
  setLocalStorageFlag,
  trialStorageId,
};

export const enterpriseDocs = {
  switchToEnterpriseUrl:
    'https://www.activepieces.com/docs/install/configuration/overview#enterprise-edition-optional',
};

export const enterpriseMotion = {
  appear:
    'animate-in fade-in-0 slide-in-from-bottom-1 duration-200 ease-expand-out motion-reduce:animate-none',
  swap: 'animate-in fade-in-0 duration-200 ease-expand-out motion-reduce:animate-none',
};

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
};

export type CreditsResetLine = {
  label: string;
  value: string;
};

type TrialStorageIdParams = {
  platformId: string;
  userId: string | null;
  endsAt: Date | null;
};
