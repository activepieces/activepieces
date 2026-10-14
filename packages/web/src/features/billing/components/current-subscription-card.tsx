import { isNil } from '@activepieces/core-utils';
import { PlatformBillingInformation } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Gem } from 'lucide-react';

import nonFreePlanBg from '@/assets/img/custom/non-free-plan-bg.jpg';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { enterpriseTrialHooks } from '../hooks/enterprise-trial-hooks';
import { billingUtils } from '../utils/billing-utils';
import { enterpriseTrialCopy } from '../utils/enterprise-trial-copy';

import { EnterpriseTrialSalesLink } from './enterprise-trial-sales-link';

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
  const trial = enterpriseTrialHooks.useTrial();
  const trialEndsAt = trial.state === 'active' ? trial.endsAt : null;

  if (!isNil(trialEndsAt) && !isPaid) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border bg-panel p-5">
        <div className="flex items-center gap-2 text-sm text-gray-11">
          <Gem className="size-4 text-accent-11" />
          {t('Current plan')}
        </div>
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-2">
            <span className="text-2xl font-semibold">
              {t('Enterprise plan trial')}
            </span>
            <Badge variant="outline" className="rounded-full">
              {enterpriseTrialCopy.daysLeftLabel(trial)}
            </Badge>
          </span>
          <span className="text-sm text-gray-11">
            {t(
              'Ends {date}, then you are back on the {plan} plan. Your credits are not affected.',
              {
                date: dayjs(trialEndsAt).format('MMM D'),
                plan: trial.basePlanName,
              },
            )}
          </span>
        </div>
        <EnterpriseTrialSalesLink
          surface="enterprise_trial_billing"
          variant="default"
          label={t('Talk to sales')}
        />
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
          <span className="text-2xl font-semibold text-gray-12">
            {planTitle(info)}
          </span>
          <Badge className="border-0 bg-panel text-accent-11 shadow-edge">
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

function planTitle(info: PlatformBillingInformation): string {
  if (!billingUtils.isPaidPlan(info.plan.plan)) {
    return t('Free plan');
  }
  return t('{plan} plan', { plan: info.autumnPlanName ?? info.plan.plan });
}
