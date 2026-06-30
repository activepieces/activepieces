import { isNil } from '@activepieces/core-utils';
import { PlanName, PlatformBillingInformation } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Clock } from 'lucide-react';

export const CreditsCard = ({ info }: CreditsCardProps) => {
  const { plan, usage } = info;
  const isPaid =
    !isNil(info.currentPlanId) && info.currentPlanId !== PlanName.FREE;
  const remaining = usage.creditsRemaining;
  const periodLabel = isPaid ? t('per month') : t('per day');
  const resetAt = resolveResetAt({ info, isPaid });

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-5">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">
          {t('Your credits')}
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold text-foreground">
            {isNil(remaining)
              ? t('Unlimited')
              : Math.round(remaining).toLocaleString()}
          </span>
          {!isNil(remaining) && (
            <span className="text-sm text-muted-foreground">
              / {plan.includedCredits.toLocaleString()} {periodLabel}
            </span>
          )}
        </div>
      </div>
      {!isNil(resetAt) && (
        <>
          <div className="border-t" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4 shrink-0" />
            <span>
              {isPaid ? t('Resets at ') : t('Resets in ')}
              <span className="font-semibold text-foreground">
                {isPaid
                  ? dayjs.unix(resetAt).format('MMM D, YYYY, h:mm A')
                  : formatCountdown(resetAt)}
              </span>
            </span>
          </div>
        </>
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
}): number | null {
  if (!isNil(info.usage.creditsNextResetAt)) {
    return info.usage.creditsNextResetAt;
  }
  if (isPaid) {
    return info.nextBillingDate ?? null;
  }
  return dayjs().add(1, 'day').startOf('day').unix();
}

function formatCountdown(resetAtUnix: number): string {
  const totalMinutes = Math.max(
    0,
    dayjs.unix(resetAtUnix).diff(dayjs(), 'minute'),
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}h`;
}

type CreditsCardProps = {
  info: PlatformBillingInformation;
};
