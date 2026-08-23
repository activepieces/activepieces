import { isNil } from '@activepieces/core-utils';
import { PlatformBillingInformation } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Clock } from 'lucide-react';

import { Progress } from '@/components/ui/progress';

import { billingUtils, CreditsResetLine } from '../../utils/billing-utils';

const CARD_DATE_FORMAT = 'D MMM YYYY, h:mm A';

export const CreditsCard = ({ info }: CreditsCardProps) => {
  const { plan, usage } = info;
  const isPaid = billingUtils.isPaidPlan(plan.plan);
  const remaining = usage.creditsRemaining;
  const isUnlimited = isNil(remaining);
  const total = plan.includedCredits;
  const used = isUnlimited ? usage.creditsUsed : Math.max(0, total - remaining);
  const percentUsed = billingUtils.percentUsed({
    used,
    total: isUnlimited ? null : total,
  });
  const footer = resolveFooter({ info, isPaid });
  const switchesToPlanName =
    info.scheduledPlanName ??
    (info.billingPortalAvailable ? info.autumnPlanName : t('Free'));

  return (
    <div className="flex flex-col rounded-xl border">
      <div className="flex flex-col gap-3 p-5">
        <span className="text-muted-foreground text-sm">
          {isUnlimited ? t('Credits used') : t('Included in plan')}
        </span>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-foreground">
              {(isUnlimited ? used : total).toLocaleString()}
            </span>
            <span className="text-muted-foreground">{t('credits')}</span>
          </div>
        </div>
        {!isUnlimited && (
          <>
            <Progress value={percentUsed} usage />
            <span className="text-sm text-muted-foreground">
              {t('{amount} remaining', {
                amount: Math.round(remaining).toLocaleString(),
              })}
            </span>
          </>
        )}
      </div>
      {!isNil(footer) && (
        <div className="flex flex-col gap-1 border-t p-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="size-4 shrink-0" />
            <span>
              {footer.label}{' '}
              <span className="font-semibold text-foreground">
                {footer.value}
              </span>
            </span>
          </div>
          {!isNil(info.trialEndsAt) && !isNil(switchesToPlanName) && (
            <span className="pl-6">
              {t('Then switches to the {plan} plan', {
                plan: switchesToPlanName,
              })}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

function resolveFooter({
  info,
  isPaid,
}: {
  info: PlatformBillingInformation;
  isPaid: boolean;
}): CreditsResetLine | null {
  if (!isNil(info.trialEndsAt)) {
    return {
      label: t('Trial ends'),
      value: dayjs(info.trialEndsAt).format(CARD_DATE_FORMAT),
    };
  }
  return billingUtils.resolveCreditsReset({
    creditsNextResetAt: info.usage.creditsNextResetAt,
    creditsResetInterval: info.creditsResetInterval,
    nextBillingDate: info.nextBillingDate,
    isPaid,
    dateFormat: CARD_DATE_FORMAT,
  });
}

type CreditsCardProps = {
  info: PlatformBillingInformation;
};
