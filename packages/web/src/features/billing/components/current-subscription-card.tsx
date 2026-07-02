import { isNil } from '@activepieces/core-utils';
import { PlanName, PlatformBillingInformation } from '@activepieces/shared';
import { t } from 'i18next';

import nonFreePlanBg from '@/assets/img/custom/non-free-plan-bg.jpg';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CurrentSubscriptionCardProps = {
  info: PlatformBillingInformation;
  onExplorePlans: () => void;
};

export const CurrentSubscriptionCard = ({
  info,
  onExplorePlans,
}: CurrentSubscriptionCardProps) => {
  const isPaid =
    !isNil(info.currentPlanId) && info.currentPlanId !== PlanName.FREE;
  const isYearly = info.currentPlanId?.endsWith('_annual') ?? false;

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

function planTitle(info: PlatformBillingInformation): string {
  if (isNil(info.currentPlanId) || info.currentPlanId === PlanName.FREE) {
    return t('Free plan');
  }
  const base = (info.currentPlanName ?? info.currentPlanId)
    .replace(/\s*\((annual|monthly|yearly)\)\s*/i, '')
    .trim();
  return t('{plan} plan', { plan: base });
}
