import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  SelfServeTrialInfo,
  SelfServeTrialState,
} from '@activepieces/shared';
import { t } from 'i18next';
import { SquareArrowOutUpRight } from 'lucide-react';
import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { flowRunUtils } from '@/features/flow-runs/utils/flow-run-utils';
import { projectCollectionUtils } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { billingQueries } from '../hooks/billing-hooks';
import { selfServeTrialHooks } from '../hooks/self-serve-trial-hooks';
import { useCreditsUsage } from '../hooks/use-credits-usage';
import { billingUtils } from '../utils/billing-utils';

import { CreditsActionButton } from './credits-action-button';
import {
  SeatGraceLine,
  SelfServeTrialLine,
  StartSelfServeTrialButton,
} from './self-serve-trial-sidebar';

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
  const { platform } = platformHooks.useCurrentPlatform();
  const shouldOfferTrial = selfServeTrialHooks.useShouldOfferTrial();
  const noticeLine = resolveNoticeLine(platform.selfServeTrial);
  const offerTrial = isNil(noticeLine) && shouldOfferTrial;

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
      <div className="flex flex-col w-full gap-2 p-2.5 bg-gray-1 rounded-md border">
        <div className="flex items-center justify-between">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-14 h-4" />
        </div>
        <Skeleton className="w-20 h-3" />
      </div>
    );
  }

  if (isNil(creditsRemaining)) {
    if (offerTrial) {
      return <StartSelfServeTrialButton />;
    }
    return isNil(noticeLine) ? null : (
      <div className="flex w-full flex-col rounded-md border bg-gray-1 p-2.5">
        {noticeLine}
      </div>
    );
  }

  const creditsText = billingUtils.formatCredits(creditsRemaining);
  const resetLine = billingUtils.resolveCreditsReset({
    creditsNextResetAt: usage.creditsNextResetAt,
    creditsResetInterval: info?.creditsResetInterval,
    nextBillingDate: info?.nextBillingDate,
  });
  return (
    <div className="flex flex-col w-full gap-2 p-2.5 bg-gray-1 rounded-md border">
      {!isNil(noticeLine) && (
        <div className="flex border-b border-gray-5 pb-2">{noticeLine}</div>
      )}
      {offerTrial && <StartSelfServeTrialButton />}
      <div className="flex h-5 items-center justify-between gap-2">
        <div className="flex items-baseline gap-1 min-w-0">
          <span className="text-sm font-semibold truncate">{creditsText}</span>
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
      <div className="flex h-5 items-center gap-2">
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

function resolveNoticeLine(trial: SelfServeTrialInfo | undefined): ReactNode {
  const graceEndsAt = trial?.seatGraceEndsAt;
  if (trial?.state === SelfServeTrialState.ACTIVE) {
    return <SelfServeTrialLine endsAt={trial.endsAt} />;
  }
  return isNil(graceEndsAt) ? null : <SeatGraceLine endsAt={graceEndsAt} />;
}
