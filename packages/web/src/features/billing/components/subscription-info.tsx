import { isNil } from '@activepieces/core-utils';
import { PlanName, PlatformBillingInformation } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { CalendarDays } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

type SubscriptionInfoProps = {
  info: PlatformBillingInformation;
};

export const SubscriptionInfo = ({ info }: SubscriptionInfoProps) => {
  const currentPlanId = info.currentPlanId;
  const isPaid = !isNil(currentPlanId) && currentPlanId !== PlanName.FREE;
  const intervalLabel = currentPlanId?.endsWith('_annual')
    ? t('/year')
    : t('/month');
  const planLabel = !isNil(info.currentPlanName)
    ? info.currentPlanName
    : isNil(currentPlanId)
    ? t('Free')
    : currentPlanId.charAt(0).toUpperCase() + currentPlanId.slice(1);
  const cancelDate = isNil(info.cancelAt)
    ? null
    : dayjs.unix(info.cancelAt).format('MMM D, YYYY');

  return (
    <div className="space-y-4">
      <Badge variant="accent" className="rounded-sm text-sm">
        {planLabel}
      </Badge>

      {isPaid && (
        <div className="flex items-baseline gap-2">
          <div className="text-5xl font-semibold">
            ${info.nextBillingAmount || Number(0).toFixed(2)}
          </div>
          <div className="text-xl text-muted-foreground">{intervalLabel}</div>
        </div>
      )}

      {isPaid && info?.nextBillingDate && isNil(info.cancelAt) && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          <span>
            {t('Next billing date ')}
            <span className="font-semibold">
              {dayjs(dayjs.unix(info.nextBillingDate).toISOString()).format(
                'MMM D, YYYY',
              )}
            </span>
          </span>
        </div>
      )}

      {!isNil(cancelDate) && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          <span>
            {!isNil(info.scheduledPlanName)
              ? t('Switches to {plan} on {date}', {
                  plan: info.scheduledPlanName,
                  date: cancelDate,
                })
              : t('Subscription will end on {date}', { date: cancelDate })}
          </span>
        </div>
      )}
    </div>
  );
};
