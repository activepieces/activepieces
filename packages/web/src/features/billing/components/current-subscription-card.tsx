import { isNil } from '@activepieces/core-utils';
import { PlatformBillingInformation } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Sparkles } from 'lucide-react';

import nonFreePlanBg from '@/assets/img/custom/non-free-plan-bg.jpg';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminControl, adminControl } from '@/lib/admin-control';
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
          'flex flex-col gap-4 rounded-xl border border-accent-7 p-5',
          'bg-gradient-to-r from-accent-2 to-accent-3',
        )}
      >
        <div className="flex items-center gap-2 text-sm text-gray-11">
          <Sparkles className="size-4 text-accent-11" />
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
          <span className="text-sm text-gray-11">
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
        data-theme="light"
        className="flex flex-col gap-6 rounded-xl bg-cover bg-center p-5"
        style={{ backgroundImage: `url(${nonFreePlanBg})` }}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-2xl font-bold text-gray-12">
            {planTitle(info)}
          </span>
          <Badge className="rounded-full border-0 bg-panel px-3 py-1 text-accent-11 shadow-edge">
            {isYearly ? t('Yearly') : t('Monthly')}
          </Badge>
        </div>
        <Button
          {...adminControl(AdminControl.BILLING_UPGRADE_OPEN)}
          className="w-full text-gray-12 shadow-edge"
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
        'flex flex-col gap-4 rounded-xl border border-accent-6 p-5',
        'bg-accent-3',
      )}
    >
      <span className="text-sm text-gray-11">{t('Current plan')}</span>
      <div className="text-2xl font-semibold">{planTitle(info)}</div>
      <Button
        {...adminControl(AdminControl.BILLING_UPGRADE_OPEN)}
        className="w-full"
        onClick={onExplorePlans}
      >
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
