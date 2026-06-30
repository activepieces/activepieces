import { isNil } from '@activepieces/core-utils';
import { PlanName, PlatformBillingInformation } from '@activepieces/shared';
import { t } from 'i18next';

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

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-primary/20 p-5',
        'bg-gradient-to-r from-amber-50 to-primary/10',
        'dark:border-primary/20 dark:from-muted/40 dark:to-primary/10',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {t('Current plan')}
        </span>
        {isPaid && (
          <Badge variant="accent" className="rounded-sm">
            {isYearly ? t('Yearly') : t('Monthly')}
          </Badge>
        )}
      </div>
      <div className="text-2xl font-semibold">{planTitle(info)}</div>
      <Button className="w-full" onClick={onExplorePlans}>
        {isPaid ? t('Switch plan') : t('Upgrade')}
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
