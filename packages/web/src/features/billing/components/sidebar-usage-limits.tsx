import { isNil } from '@activepieces/core-utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { SquareArrowOutUpRight } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { flowRunUtils } from '@/features/flow-runs/utils/flow-run-utils';
import { projectCollectionUtils } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { billingQueries } from '../hooks/billing-hooks';
import { useCreditsUsage } from '../hooks/use-credits-usage';
import { billingUtils, BILLING_DATE_FORMAT } from '../utils/billing-utils';

import { CreditsActionButton } from './credits-action-button';

export const SidebarUsageLimits = React.memo(() => {
  const { project } = projectCollectionUtils.useCurrentProject();
  const {
    platformId,
    usage,
    isPlatformAdmin,
    isPaid,
    creditsRemaining,
    isUnlimited,
    percentUsed,
    severity,
  } = useCreditsUsage();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  const inWarning = !isUnlimited && severity !== 'default';
  const canManage = isPlatformAdmin && inWarning;
  const needsSubscription = canManage && isPaid;

  const { data: info } = billingQueries.usePlatformSubscription(
    platformId,
    needsSubscription,
  );

  if (edition === ApEdition.COMMUNITY) {
    return null;
  }

  if (isNil(authenticationSession.getProjectId())) {
    return null;
  }

  if (isNil(project) || isNil(usage)) {
    return (
      <div className="flex w-full flex-col gap-2 rounded-xl bg-panel p-3 shadow-edge">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-14" />
        </div>
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  if (isNil(creditsRemaining)) {
    return null;
  }

  const creditsText = billingUtils.formatCredits(creditsRemaining);
  const resetLine = billingUtils.resolveCreditsReset({
    creditsNextResetAt: usage.creditsNextResetAt,
    creditsResetInterval: info?.creditsResetInterval,
    nextBillingDate: info?.nextBillingDate,
    dateFormat: BILLING_DATE_FORMAT,
  });
  return (
    <div className="flex w-full flex-col gap-2 rounded-xl bg-panel p-3 shadow-edge">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-1">
          <span className="truncate text-sm font-semibold tabular-nums">
            {creditsText}
          </span>
          <span className="text-xs text-gray-11">{t('credits')}</span>
        </div>
        <Badge
          className={cn(
            'shrink-0',
            flowRunUtils.getStatusContainerClassName({ variant: severity }),
          )}
        >
          {t('{percent}% used', { percent: percentUsed })}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        {!isNil(resetLine) && (
          <TextWithTooltip
            tooltipMessage={resetLine.label + ' ' + resetLine.value}
          >
            <span className="min-w-0 truncate text-xs text-gray-11">
              {resetLine.label} {resetLine.value}
            </span>
          </TextWithTooltip>
        )}
        <span className="grow"></span>
        {isPlatformAdmin && (
          <Link to="/platform/billing" className="shrink-0">
            <Button variant="link" size="xs">
              {t('Billing')} <SquareArrowOutUpRight />
            </Button>
          </Link>
        )}
      </div>
      {canManage && <CreditsActionButton className="w-full" />}
    </div>
  );
});

SidebarUsageLimits.displayName = 'SidebarUsageLimits';
