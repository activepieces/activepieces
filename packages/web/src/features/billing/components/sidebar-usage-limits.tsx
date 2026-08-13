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

  if (isNil(project) || isNil(usage)) {
    return (
      <div className="flex flex-col w-full gap-2 p-2.5 bg-background rounded-md border">
        <div className="flex items-center justify-between">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-14 h-4" />
        </div>
        <Skeleton className="w-20 h-3" />
      </div>
    );
  }

  if (isNil(creditsRemaining)) {
    return null;
  }

  const creditsText = billingUtils.formatCredits(Math.round(creditsRemaining));
  const resetLine = billingUtils.resolveCreditsReset({
    creditsNextResetAt: usage.creditsNextResetAt,
    creditsResetInterval: info?.creditsResetInterval,
    nextBillingDate: info?.nextBillingDate,
    isPaid,
    dateFormat: BILLING_DATE_FORMAT,
  });
  return (
    <div className="flex flex-col w-full gap-2 p-2.5 bg-background rounded-md border">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-1 min-w-0">
          <span className="text-sm font-semibold truncate">{creditsText}</span>
          <span className="text-xs text-muted-foreground">{t('credits')}</span>
        </div>
        <Badge
          className={cn(
            'shrink-0',
            flowRunUtils.getStatusContainerClassName(severity),
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
            <span className="min-w-0 truncate text-xs text-muted-foreground">
              {resetLine.label} {resetLine.value}
            </span>
          </TextWithTooltip>
        )}
        <span className="grow"></span>
        {isPlatformAdmin && (
          <Link to="/platform/setup/billing" className="shrink-0">
            <Button variant="link" size="xs">
              {t('Billing')} <SquareArrowOutUpRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
      {canManage && <CreditsActionButton className="w-full" />}
    </div>
  );
});

SidebarUsageLimits.displayName = 'SidebarUsageLimits';
