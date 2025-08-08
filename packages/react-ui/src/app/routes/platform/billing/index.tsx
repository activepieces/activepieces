import { t } from 'i18next';
import { Wand, Zap } from 'lucide-react';
import { useState } from 'react';

import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/spinner';
import { ActivateLicenseDialog } from '@/features/billing/components/activate-license-dialog';
import { ActiveFlowAddon } from '@/features/billing/components/active-flow-addon';
import { AICreditUsage } from '@/features/billing/components/ai-credit-usage';
import { AiCreditsUsageTable } from '@/features/billing/components/ai-credits-usage-table';
import { FeatureStatus } from '@/features/billing/components/features-status';
import { LicenseKey } from '@/features/billing/components/lisence-key';
import { ProjectAddon } from '@/features/billing/components/project-addon';
import { SubscriptionInfo } from '@/features/billing/components/subscription-info';
import { useManagePlanDialogStore } from '@/features/billing/components/upgrade-dialog/store';
import { UsageCards } from '@/features/billing/components/usage-cards';
import { UserSeatAddon } from '@/features/billing/components/user-seat-addon';
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
  const isPlus = platformPlanInfo?.plan.plan === PlanName.PLUS;
  const isTrial = status === ApSubscriptionStatus.TRIALING;
  const isEnterprise =
    !isNil(platformPlanInfo?.plan.licenseKey) ||
    platformPlanInfo?.plan.plan === PlanName.ENTERPRISE ||
    edition === ApEdition.ENTERPRISE;

  if (isPlatformSubscriptionLoading || isNil(platformPlanInfo)) {
    return (
      <article className="h-full flex items-center justify-center w-full">
        <LoadingSpinner />
      </article>
    );
  }

  if (isError) {
    return (
      <article className="h-full flex items-center justify-center w-full">
        {t('Failed to load billing information')}
      </article>
    );
  }

  return (
    <>
      <DashboardPageHeader
        title={t('Billing')}
        description={t('Manage billing, usage and limits')}
        beta={true}
      >
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
      </DashboardPageHeader>
      <section className="flex flex-col w-full gap-6">
        {!isEnterprise && <SubscriptionInfo info={platformPlanInfo} />}

        <UsageCards platformSubscription={platformPlanInfo} />

        {isBusinessPlan ||
          (isPlus && !isTrial && (
            <ActiveFlowAddon platformSubscription={platformPlanInfo} />
          ))}

        {isBusinessPlan && (
          <div className="grid grid-cols-2 gap-6">
            <ProjectAddon platformSubscription={platformPlanInfo} />
            <UserSeatAddon platformSubscription={platformPlanInfo} />
          </div>
        )}

        {!isEnterprise && (
          <AICreditUsage platformSubscription={platformPlanInfo} />
        )}

        {isEnterprise && (
          <>
            <h3 className="text-lg font-semibold">{t('AI Credits')}</h3>
            <AiCreditsUsageTable />
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
      </section>{' '}
    </>
  );
}
