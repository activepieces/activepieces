import { isNil } from '@activepieces/core-utils';
import { PlatformBillingInformation } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';

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

export const billingUtils = {
  resolveSeatCap,
  scheduledCapNotice,
};

export type SeatCap = {
  capBinds: boolean;
  scheduledCap: number | null;
  effectiveLimit: number | null;
  scheduledPlanName: string;
  switchDate: string;
};
