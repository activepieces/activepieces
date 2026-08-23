import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { SquareArrowOutUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useCreditsUsage } from '@/features/billing';
import { formatUtils } from '@/lib/format-utils';

const DAY_MS = 1000 * 60 * 60 * 24;

export function RailCreditsCard() {
  const { usage, creditsRemaining, isUnlimited, percentUsed } =
    useCreditsUsage();

  if (isNil(usage) || isUnlimited || isNil(creditsRemaining)) {
    return null;
  }

  const resetDays = getResetDays(usage.creditsNextResetAt);

  return (
    <div className="mx-2 mb-1 rounded-lg border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold">
            {formatUtils.formatNumber(Math.round(creditsRemaining))}
          </span>
          <span className="text-xs text-muted-foreground">{t('credits')}</span>
        </div>
        <span className="shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {t('{percent}% used', { percent: percentUsed })}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        {isNil(resetDays) ? (
          <span />
        ) : (
          <span className="text-xs text-muted-foreground">
            {t('Resets in {days, plural, =1 {# day} other {# days}}', {
              days: resetDays,
            })}
          </span>
        )}
        <Link
          to="/platform/setup/billing"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {t('Billing')}
          <SquareArrowOutUpRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}

function getResetDays(nextReset: string | null | undefined): number | null {
  if (isNil(nextReset)) {
    return null;
  }
  const at = new Date(nextReset).getTime();
  if (Number.isNaN(at)) {
    return null;
  }
  return Math.max(0, Math.ceil((at - Date.now()) / DAY_MS));
}
