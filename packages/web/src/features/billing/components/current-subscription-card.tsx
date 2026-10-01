import { PlatformBillingInformation } from '@activepieces/shared';
import { t } from 'i18next';

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

  if (isPaid) {
    return (
      <div
        data-theme="light"
        className="flex flex-col gap-4 rounded-2xl bg-cover bg-center p-4"
        style={{ backgroundImage: `url(${nonFreePlanBg})` }}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-2xl font-semibold text-gray-12">
            {planTitle(info)}
          </span>
          <Badge variant="info">{isYearly ? t('Yearly') : t('Monthly')}</Badge>
        </div>
        <Button
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
        'flex flex-col gap-4 rounded-2xl border border-accent-6 p-4',
        'bg-accent-3',
      )}
    >
      <span className="text-xs text-gray-11">{t('Current plan')}</span>
      <div className="text-2xl font-semibold">{planTitle(info)}</div>
      <Button className="w-full" onClick={onExplorePlans}>
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
