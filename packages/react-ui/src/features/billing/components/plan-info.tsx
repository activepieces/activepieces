import dayjs from 'dayjs';
import { t } from 'i18next';
import { CalendarDays, CreditCard, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PlatformBillingInformation } from '@activepieces/shared';

type SubscriptionInfoProps = {
  platformSubscription?: PlatformBillingInformation;
  calculatedTotalCost: string;
  isAnnual?: boolean;
  className?: string;
};

export const SubscriptionInfo = ({
  platformSubscription,
  calculatedTotalCost,
  isAnnual = false,
  className,
}: SubscriptionInfoProps) => {
  const planName = platformSubscription?.plan.plan || 'Free';
  const isFreePlan = planName.toLowerCase() === 'free';
  const nextBillingDate = platformSubscription?.nextBillingDate;

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'enterprise':
        return 'default';
      case 'business':
        return 'secondary';
      case 'plus':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatBillingDate = (date: string) => {
    const formatted = dayjs(date);
    const isToday = formatted.isSame(dayjs(), 'day');
    const isTomorrow = formatted.isSame(dayjs().add(1, 'day'), 'day');

    if (isToday) return t('Today');
    if (isTomorrow) return t('Tomorrow');
    return formatted.format('MMM D, YYYY');
  };

  return (
    <Card className={cn('p-6 space-y-4', className)}>
      {/* Plan Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            <span>{t('Current Plan')}</span>
          </div>
        </div>
        <Badge variant={getPlanBadgeVariant(planName)} className="font-medium">
          {planName}
        </Badge>
      </div>

      {/* Cost Display */}
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tight text-foreground">
            {isFreePlan ? '$0' : `$${calculatedTotalCost}`}
          </span>
          <div className="flex flex-col">
            <span className="text-lg text-muted-foreground font-medium">
              /{isAnnual ? t('year') : t('month')}
            </span>
            {isAnnual && !isFreePlan && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {t('Save 20%')}
              </span>
            )}
          </div>
        </div>

        {!isFreePlan && isAnnual && (
          <div className="text-sm text-muted-foreground">
            ${(parseFloat(calculatedTotalCost) / 12).toFixed(2)}/month{' '}
            {t('billed annually')}
          </div>
        )}
      </div>

      {/* Billing Information */}
      {nextBillingDate && !isFreePlan && (
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="w-4 h-4" />
            <span className="font-medium">{t('Next billing')}:</span>
            <span className="text-foreground font-medium">
              {formatBillingDate(nextBillingDate)}
            </span>
          </div>
        </div>
      )}

      {/* Free Plan Message */}
      {isFreePlan && (
        <div className="pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            {t('Upgrade anytime to unlock premium features')}
          </div>
        </div>
      )}
    </Card>
  );
};
