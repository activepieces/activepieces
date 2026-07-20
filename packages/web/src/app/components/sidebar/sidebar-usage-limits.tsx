import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  AutumnFeatureId,
  PlanName,
  PlatformRole,
} from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { ArrowUpCircle, Coins, SquareArrowOutUpRight } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AutoRechargeConfigDialog,
  billingQueries,
  useManagePlanDialogStore,
} from '@/features/billing';
import { flowRunUtils } from '@/features/flow-runs/utils/flow-run-utils';
import { projectCollectionUtils } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

const AMBER_THRESHOLD = 70;
const RED_THRESHOLD = 90;

const SidebarUsageLimits = React.memo(() => {
  const { project } = projectCollectionUtils.useCurrentProject();
  const { platform } = platformHooks.useCurrentPlatform();
  const currentUser = userHooks.useCurrentUser();
  const { openDialog: openManagePlanDialog } = useManagePlanDialogStore();
  const [autoRechargeOpen, setAutoRechargeOpen] = useState(false);
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  const usage = platform.usage;
  const isPlatformAdmin = currentUser.data?.platformRole === PlatformRole.ADMIN;
  const isPaid =
    !isNil(platform.plan.plan) && platform.plan.plan !== PlanName.FREE;

  const creditsRemaining = usage?.creditsRemaining ?? null;
  const isUnlimited = isNil(creditsRemaining);
  const creditsUsed = Math.round(usage?.creditsUsed ?? 0);
  const total = isUnlimited ? 0 : creditsUsed + Math.round(creditsRemaining);
  const percentUsed =
    isUnlimited || total <= 0
      ? 0
      : Math.min(100, Math.round((creditsUsed / total) * 100));

  const inWarning = !isUnlimited && percentUsed >= AMBER_THRESHOLD;
  const canManage = isPlatformAdmin && inWarning;
  const needsSubscription = canManage && isPaid;

  const { data: info } = billingQueries.usePlatformSubscription(
    platform.id,
    needsSubscription,
  );
  const creditsFeature = info?.topUpFeatures.find(
    (feature) => feature.featureId === AutumnFeatureId.AP_CREDITS,
  );
  const creditsAutoTopUp = info?.autoTopUps.find(
    (config) => config.featureId === AutumnFeatureId.AP_CREDITS,
  );
  const autoRechargeEnabled =
    (creditsAutoTopUp?.enabled ?? false) && !isNil(creditsAutoTopUp);
  const isTrial = !isNil(info?.trialEndsAt);

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

  const displayedCredits = Math.round(creditsRemaining);
  const creditsText =
    displayedCredits >= 1_000_000
      ? formatUtils.formatNumberCompact(displayedCredits)
      : formatUtils.formatNumber(displayedCredits);

  const resetAt =
    usage.creditsNextResetAt ??
    (isPaid ? null : dayjs().add(1, 'day').startOf('day').toISOString());
  const resetDays = isNil(resetAt)
    ? null
    : Math.max(
        0,
        dayjs(resetAt).startOf('day').diff(dayjs().startOf('day'), 'day'),
      );
  const showUpgradeButton = canManage && (!isPaid || isTrial);
  const showAutoRechargeButton =
    canManage && isPaid && !isTrial && !isNil(creditsFeature);
  const showBillingButton = !showUpgradeButton && !showAutoRechargeButton;
  return (
    <div className="flex flex-col w-full gap-2 p-2.5 bg-background rounded-md border">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-1 min-w-0">
          <span className="text-sm font-semibold truncate">{creditsText}</span>
          <span className="text-xs text-muted-foreground">{t('credits')}</span>
        </div>
        <Badge className={cn('shrink-0', creditsBadgeClass(percentUsed))}>
          {t('{percent}% used', { percent: percentUsed })}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        {!isNil(resetDays) && (
          <span className="text-xs text-muted-foreground">
            {t('creditsResetRelative', { count: resetDays })}
          </span>
        )}
        <span className="grow"></span>
        {showBillingButton && (
          <Link to="/platform/setup/billing">
            <Button variant="link" size="xs">
              {t('Billing')} <SquareArrowOutUpRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      {showUpgradeButton && (
        <Button
          variant="basic"
          size="sm"
          className="w-full border"
          onClick={openManagePlanDialog}
        >
          <ArrowUpCircle className="size-4" />
          {t('Upgrade plan')}
        </Button>
      )}

      {showAutoRechargeButton && (
        <>
          <Button
            variant="basic"
            size="sm"
            className="w-full border"
            onClick={() => setAutoRechargeOpen(true)}
          >
            <Coins className="size-4" />
            {autoRechargeEnabled
              ? t('Edit auto recharge')
              : t('Enable auto recharge')}
          </Button>
          <AutoRechargeConfigDialog
            key={autoRechargeOpen ? 'auto-open' : 'auto-closed'}
            isOpen={autoRechargeOpen}
            onOpenChange={setAutoRechargeOpen}
            feature={creditsFeature}
            includedCredits={platform.plan.includedCredits}
            currentThreshold={
              autoRechargeEnabled ? creditsAutoTopUp.threshold : undefined
            }
            currentCreditsToAdd={
              autoRechargeEnabled ? creditsAutoTopUp.quantity : undefined
            }
            currentMaxMonthlyTopUps={
              autoRechargeEnabled
                ? creditsAutoTopUp.maxMonthlyTopUps
                : undefined
            }
          />
        </>
      )}
    </div>
  );
});

function creditsBadgeClass(percentUsed: number): string {
  if (percentUsed >= RED_THRESHOLD) {
    return flowRunUtils.getStatusContainerClassName('error');
  }
  if (percentUsed >= AMBER_THRESHOLD) {
    return flowRunUtils.getStatusContainerClassName('warning');
  }
  return flowRunUtils.getStatusContainerClassName('default');
}

SidebarUsageLimits.displayName = 'UsageLimitsButton';
export default SidebarUsageLimits;
