import { isNil } from '@activepieces/core-utils';
import { PlatformBillingInformation } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Clock } from 'lucide-react';

import { Meter } from '@/components/custom/stats';
import { Card } from '@/components/ui/card';

import { billingUtils, CreditsResetLine } from '../../utils/billing-utils';

const CARD_DATE_FORMAT = 'D MMM YYYY, h:mm A';

export const CreditsCard = ({ info }: CreditsCardProps) => {
  const { plan, usage } = info;
  const remaining = usage.creditsRemaining;
  const isUnlimited = isNil(remaining);
  const total = plan.includedCredits;
  const used = isUnlimited ? usage.creditsUsed : Math.max(0, total - remaining);
  const percentUsed = billingUtils.percentUsed({
    used,
    total: isUnlimited ? null : total,
  });
  const footer = resolveFooter(info);
  const switchesToPlanName =
    info.scheduledPlanName ??
    (info.billingPortalAvailable ? info.autumnPlanName : t('Free'));

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-col gap-3 p-4">
        <span className="text-xs text-gray-11">
          {isUnlimited ? t('Credits used') : t('Included in plan')}
        </span>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-gray-12 tabular-nums">
              {(isUnlimited ? used : total).toLocaleString()}
            </span>
            <span className="text-sm text-gray-11">{t('credits')}</span>
          </div>
        </div>
        {!isUnlimited && (
          <Meter
            value={used}
            max={total}
            label={t('{amount} remaining', {
              amount: Math.round(remaining).toLocaleString(),
            })}
            limit={t('{percent}% used', { percent: percentUsed })}
          />
        )}
      </div>
      {!isNil(footer) && (
        <div className="flex flex-col gap-1 border-t p-4 text-xs text-gray-11">
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 shrink-0" />
            <span>
              {footer.label}{' '}
              <span className="font-semibold text-gray-12">{footer.value}</span>
            </span>
          </div>
          {!isNil(info.trialEndsAt) && !isNil(switchesToPlanName) && (
            <span className="pl-5.5">
              {t('Then switches to the {plan} plan', {
                plan: switchesToPlanName,
              })}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};

function resolveFooter(
  info: PlatformBillingInformation,
): CreditsResetLine | null {
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
    dateFormat: CARD_DATE_FORMAT,
  });
}

type CreditsCardProps = {
  info: PlatformBillingInformation;
};
