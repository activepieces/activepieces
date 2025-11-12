import dayjs from 'dayjs';
import { t } from 'i18next';
import { CalendarDays } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { isNil, PlatformBillingInformation } from '@activepieces/shared';

type SubscriptionInfoProps = {
  info: PlatformBillingInformation;
};

export const SubscriptionInfo = ({ info }: SubscriptionInfoProps) => {
  return (
    <div className="space-y-4">
      <Badge variant="accent" className="rounded-sm text-sm">
        {isNil(info.plan.plan)
          ? t('Free')
          : info?.plan.plan.charAt(0).toUpperCase() + info?.plan.plan.slice(1)}
      </Badge>
      <div className="flex items-baseline gap-2">
        <div className="text-5xl font-semibold">
          ${info.nextBillingAmount || Number(0).toFixed(2)}
        </div>
        <div className="text-xl text-muted-foreground">{t('/month')}</div>
      </div>

      {info?.nextBillingDate && isNil(info.cancelAt) && (
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

      {info?.cancelAt && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          <span>
            {t('Subscription will end')}{' '}
            <span className="font-semibold">
              {dayjs(dayjs.unix(info.cancelAt).toISOString()).format(
                'MMM D, YYYY',
              )}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};
