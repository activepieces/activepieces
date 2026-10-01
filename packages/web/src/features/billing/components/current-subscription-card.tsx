import { isNil } from '@activepieces/core-utils';
import { PlatformBillingInformation } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Sparkles } from 'lucide-react';

import nonFreePlanBg from '@/assets/img/custom/non-free-plan-bg.jpg';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { billingUtils } from '../utils/billing-utils';

type CurrentSubscriptionCardProps = {
  info: PlatformBillingInformation;
  onExplorePlans: () => void;
};

export const CurrentSubscriptionCard = ({
  info,
  onExplorePlans,
}: CurrentSubscriptionCardProps) => {
  const isPaid = billingUtils.isPaidPlan(info.plan.plan);
  const isYearly = billingUtils.isYearlyPlan(info);
  const trialEndsAt = liveEnterpriseTrialEndsAt(info);

  if (!isNil(trialEndsAt)) {
    return (
      <div
        className={cn(
          'flex flex-col gap-4 rounded-xl border border-primary/30 p-5',
          'bg-gradient-to-r from-primary/5 to-primary/15',
        )}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-primary" />
          {t('Current plan')}
        </div>
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-2">
            <span className="text-2xl font-semibold">
              {t('Enterprise Trial')}
            </span>
            <Badge variant="outline" className="rounded-full">
              {t('{count, plural, =1 {1 day left} other {# days left}}', {
                count: Math.max(
                  1,
                  Math.ceil(dayjs(trialEndsAt).diff(dayjs(), 'hour') / 24),
                ),
              })}
            </Badge>
          </span>
          <span className="text-sm text-muted-foreground">
            {t('Ends {date}, then you go back to the {plan}.', {
              date: dayjs(trialEndsAt).format('MMM D, YYYY'),
              plan: planTitle(info),
            })}
          </span>
        </div>
        <Button className="w-full" onClick={onExplorePlans}>
          {t('Upgrade')}
        </Button>
      </div>
    );
  }

  if (isPaid) {
    return (
      <div
        className="flex flex-col gap-6 rounded-xl bg-cover bg-center p-5"
        style={{ backgroundImage: `url(${nonFreePlanBg})` }}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-2xl font-bold text-neutral-900">
            {planTitle(info)}
          </span>
          <Badge className="rounded-full border-0 bg-white px-3 py-1 text-primary shadow-sm hover:bg-white">
            {isYearly ? t('Yearly') : t('Monthly')}
          </Badge>
        </div>
        <Button
          className="w-full  text-neutral-900 shadow-sm hover:bg-white/90"
          onClick={onExplorePlans}
          variant={'outline'}
        >
          {t('Upgrade')}
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-primary/20 p-5',
        'bg-gradient-to-r from-amber-50 to-primary/10',
        'dark:border-primary/20 dark:from-muted/40 dark:to-primary/10',
      )}
    >
      <span className="text-sm text-muted-foreground">{t('Current plan')}</span>
      <div className="text-2xl font-semibold">{planTitle(info)}</div>
      <Button className="w-full" onClick={onExplorePlans}>
        {t('Upgrade')}
      </Button>
    </div>
  );
};

function liveEnterpriseTrialEndsAt(
  info: PlatformBillingInformation,
): string | null {
  const endsAt = info.plan.enterpriseTrialEndsAt;
  if (isNil(endsAt) || dayjs(endsAt).isBefore(dayjs())) {
    return null;
  }
  return endsAt;
}

function planTitle(info: PlatformBillingInformation): string {
  if (!billingUtils.isPaidPlan(info.plan.plan)) {
    return t('Free plan');
  }
  return t('{plan} plan', { plan: info.autumnPlanName ?? info.plan.plan });
}
