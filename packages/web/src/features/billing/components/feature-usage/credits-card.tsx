import { isNil } from '@activepieces/core-utils';
import { PlanName, PlatformBillingInformation } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Clock } from 'lucide-react';

import { Progress } from '@/components/ui/progress';

export const CreditsCard = ({ info }: CreditsCardProps) => {
  const { plan, usage } = info;
  const isPaid =
    !isNil(info.currentPlanId) && info.currentPlanId !== PlanName.FREE;
  const remaining = usage.creditsRemaining;
  const isUnlimited = isNil(remaining);
  const total = plan.includedCredits;
  const used = isUnlimited ? usage.creditsUsed : Math.max(0, total - remaining);
  const percentUsed =
    isUnlimited || total <= 0
      ? 0
      : Math.min(100, Math.round((used / total) * 100));
  const resetAt = resolveResetAt({ info, isPaid });
  const footerDate = info.trialEndsAt ?? resetAt;

  return (
    <div className="flex flex-col rounded-xl border">
      <div className="flex flex-col gap-3 p-5">
        <span className="text-muted-foreground text-sm">
          {isUnlimited ? t('Credits used') : t('Included in your plan')}
        </span>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-foreground">
              {(isUnlimited ? used : total).toLocaleString()}
            </span>
            <span className="text-muted-foreground">{t('credits')}</span>
          </div>
        </div>
        {!isUnlimited && (
          <>
            <Progress value={percentUsed} />
            <span className="text-sm text-muted-foreground">
              {t('{amount} remaining', {
                amount: Math.round(remaining).toLocaleString(),
              })}
            </span>
          </>
        )}
      </div>
      {!isNil(footerDate) && (
        <div className="flex items-center gap-2 border-t p-4 text-sm text-muted-foreground">
          <Clock className="size-4 shrink-0" />
          <span>
            {info.trialEndsAt ? t('Trial ends') : t('Resets in')}{' '}
            <span className="font-semibold text-foreground">
              {dayjs(footerDate).format('D MMM YYYY, h:mm A')}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

function resolveResetAt({
  info,
  isPaid,
}: {
  info: PlatformBillingInformation;
  isPaid: boolean;
}): string | null {
  if (!isNil(info.usage.creditsNextResetAt)) {
    return info.usage.creditsNextResetAt;
  }
  if (isPaid) {
    return info.nextBillingDate ?? null;
  }
  return dayjs().add(1, 'day').startOf('day').toISOString();
}

type CreditsCardProps = {
  info: PlatformBillingInformation;
};
