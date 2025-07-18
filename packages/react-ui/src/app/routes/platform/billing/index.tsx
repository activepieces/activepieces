import { t } from 'i18next';
import { Wand, Zap } from 'lucide-react';
import { useState } from 'react';

import { TableTitle } from '@/components/custom/table-title';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/spinner';
import { ActivateLicenseDialog } from '@/features/billing/components/activate-license-dialog';
import { AICreditUsage } from '@/features/billing/components/ai-credit-usage';
import { BusinessUserSeats } from '@/features/billing/components/business-user-seats';
import { FeatureStatus } from '@/features/billing/components/features-status';
import { LicenseKey } from '@/features/billing/components/lisence-key';
import { SubscriptionInfo } from '@/features/billing/components/subscription-info';
import { TasksUsage } from '@/features/billing/components/tasks-usage';
import { useManagePlanDialogStore } from '@/features/billing/components/upgrade-dialog/store';
import { UsageCards } from '@/features/billing/components/usage-cards';
import {
  billingMutations,
  billingQueries,
} from '@/features/billing/lib/billing-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { ApSubscriptionStatus, PlanName } from '@activepieces/ee-shared';
import { ApEdition, ApFlagId, isNil } from '@activepieces/shared';

export default function Billing() {
  const [isActivateLicenseKeyDialogOpen, setIsActivateLicenseKeyDialogOpen] =
    useState(false);
  const { platform } = platformHooks.useCurrentPlatform();
  const openDialog = useManagePlanDialogStore((state) => state.openDialog);

  const {
    data: platformPlanInfo,
    isLoading: isPlatformSubscriptionLoading,
    isError,
  } = billingQueries.usePlatformSubscription(platform.id);

  const { mutate: redirectToPortalSession } = billingMutations.usePortalLink();

  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const status = platformPlanInfo?.plan?.stripeSubscriptionStatus;
  const isSubscriptionActive = [ApSubscriptionStatus.ACTIVE].includes(
    status as ApSubscriptionStatus,
  );
  const isBusinessPlan = platformPlanInfo?.plan.plan === PlanName.BUSINESS;
  const isEnterpriseEdition = edition === ApEdition.ENTERPRISE;
  const isEnterprise =
    !isNil(platformPlanInfo?.plan.licenseKey) ||
    edition === ApEdition.ENTERPRISE;

  if (isPlatformSubscriptionLoading || isNil(platformPlanInfo)) {
    return (
      <article className="flex flex-col w-full gap-8">
        <TableTitle>Billing</TableTitle>
        <LoadingSpinner />
      </article>
    );
  }

  if (isError) {
    return (
      <article className="flex flex-col w-full gap-8">
        <TableTitle>Billing</TableTitle>
        <div className="flex items-center justify-center h-[400px] text-destructive">
          {t('Failed to load billing information')}
        </div>
      </article>
    );
  }

  return (
    <article className="flex flex-col w-full gap-8">
      <div className="flex justify-between items-center">
        <div>
          <TableTitle>{t('Billing')}</TableTitle>
          <p className="text-sm text-muted-foreground">
            {t('Manage billing, usage and limits')}
          </p>
        </div>

        {isEnterprise ? (
          <Button
            variant="default"
            onClick={() => setIsActivateLicenseKeyDialogOpen(true)}
          >
            <Zap className="w-4 h-4" />
            {platform.plan.licenseKey
              ? t('Update License')
              : t('Activate License')}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            {isSubscriptionActive && (
              <Button
                variant="outline"
                onClick={() => redirectToPortalSession()}
              >
                {t('Access Billing Portal')}
              </Button>
            )}
            <Button variant="default" onClick={() => openDialog()}>
              {t('Upgrade Plan')}
            </Button>
          </div>
        )}
      </div>

      {!isEnterprise && <SubscriptionInfo info={platformPlanInfo} />}

      <UsageCards platformSubscription={platformPlanInfo} />
      {isBusinessPlan && (
        <BusinessUserSeats platformSubscription={platformPlanInfo} />
      )}
      {!isEnterpriseEdition && (
        <>
          <AICreditUsage platformSubscription={platformPlanInfo} />
          <TasksUsage platformSubscription={platformPlanInfo} />
        </>
      )}

      {isEnterprise ? (
        <LicenseKey platform={platform} />
      ) : (
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg border">
                  <Wand className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {t('Enabled Features')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      'The following features are currently enabled as part of your platform plan.',
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            <FeatureStatus platform={platform} />
          </CardContent>
        </Card>
      )}
      <ActivateLicenseDialog
        isOpen={isActivateLicenseKeyDialogOpen}
        onOpenChange={setIsActivateLicenseKeyDialogOpen}
      />
    </article>
  );
}
