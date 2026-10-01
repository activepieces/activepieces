import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  PlanName,
  PlatformBillingInformation,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink, RefreshCw, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { BillingPageShell } from '@/app/components/billing-page-shell';
import { Page, PageHeader } from '@/components/custom/page';
import { Panel } from '@/components/custom/panel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  CurrentSubscriptionCard,
  CreditsCard,
  AutoRechargeCard,
  CancelSubscriptionDialog,
  KeepPlanDialog,
  planSelectorUtils,
  LicenseKey,
  UsersCard,
  billingMutations,
  billingUtils,
  useCancelSubscriptionGuard,
  useManagePlanDialogStore,
} from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { UsageTab } from './usage-tab';

export function BillingPlanTab() {
  return (
    <BillingPageShell
      lockTitle={t('Billing and usage')}
      errorMessage={t('Failed to load billing information')}
    >
      {({ platform, info }) => <PlanTab platform={platform} info={info} />}
    </BillingPageShell>
  );
}

export function BillingUsageTab() {
  return (
    <BillingPageShell
      lockTitle={t('Billing and usage')}
      errorMessage={t('Failed to load billing information')}
    >
      {({ platform, info }) => <UsageTab platform={platform} info={info} />}
    </BillingPageShell>
  );
}

function BillingRefreshButton() {
  const { mutate: refreshBilling, isPending: isRefreshing } =
    billingMutations.useRefreshSubscription();

  return (
    <Button
      variant="outline"
      loading={isRefreshing}
      onClick={() =>
        refreshBilling(undefined, {
          onSuccess: () => toast.success(t('Billing information refreshed')),
        })
      }
    >
      <RefreshCw />
      {t('Refresh')}
    </Button>
  );
}

function PlanTab({ platform, info }: PlanTabProps) {
  const { openDialog } = useManagePlanDialogStore();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCommunity = edition === ApEdition.COMMUNITY;
  const isCloud = edition === ApEdition.CLOUD;
  const { mutate: redirectToPortalSession, isPending: isOpeningPortal } =
    billingMutations.usePortalLink();
  const [isKeepPlanOpen, setIsKeepPlanOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const { cancelWithSeatCheck, deactivateUsersDialog } =
    useCancelSubscriptionGuard();

  const isPaid = billingUtils.isPaidPlan(info.plan.plan);
  const { creditsFeature, appSumoCreditsFeature, seatsFeature } = info;
  const isAppSumoCredits =
    isNil(creditsFeature) && !isNil(appSumoCreditsFeature);
  const displayedCreditsFeature = creditsFeature ?? appSumoCreditsFeature;
  const appSumoAiCreditsTotal =
    (info.usage.appSumoAiCreditsUsed ?? 0) +
    (info.usage.appSumoAiCreditsRemaining ?? 0);
  const autoRechargeNote = isAppSumoCredits
    ? t('Auto recharge your AI credits — {remaining} of {total} left.', {
        remaining: (info.usage.appSumoAiCreditsRemaining ?? 0).toLocaleString(),
        total: appSumoAiCreditsTotal.toLocaleString(),
      })
    : undefined;
  const hasBillingPortal = info.billingPortalAvailable;
  const isComped = isPaid && isNil(info.trialEndsAt) && !hasBillingPortal;
  const isCompedLifetimePlan =
    info.plan.plan === PlanName.APPSUMO ||
    info.plan.plan === PlanName.FREE_LEGACY;
  const canManageSubscription = isPaid && !isComped;
  const canCancel =
    canManageSubscription && !isCompedLifetimePlan && isNil(info.cancelAt);
  const hasLicenseKey = !isNil(platform.plan.licenseKey);
  const isTrialKeySection = isCloud && !hasLicenseKey;
  const licenseKeyCopy = licenseKeySectionCopy({ hasLicenseKey, isCloud });

  return (
    <Page width="narrow">
      <PageHeader
        title={t('Billing')}
        description={t(
          'Your plan, credits and seats. For questions about billing, write to support@activepieces.com.',
        )}
      >
        <BillingRefreshButton />
        {canManageSubscription && hasBillingPortal && (
          <Button
            variant="outline"
            loading={isOpeningPortal}
            onClick={() => redirectToPortalSession()}
          >
            <ExternalLink />
            {t('Invoices and payment method')}
          </Button>
        )}
      </PageHeader>

      {info.billingUnavailable && (
        <Alert variant="warning">
          <TriangleAlert />
          <AlertDescription>
            {t(
              'Our billing service is temporarily unavailable, so plan and credit details may be out of date. Your flows keep running — we are working on a fix.',
            )}
          </AlertDescription>
        </Alert>
      )}

      {!isCommunity && (
        <CurrentSubscriptionCard
          info={info}
          hasLicenseKey={hasLicenseKey}
          showNextInvoice={
            canManageSubscription &&
            hasBillingPortal &&
            isNil(info.trialEndsAt) &&
            isNil(info.cancelAt)
          }
          onExplorePlans={openDialog}
          onKeepPlan={
            canManageSubscription && !isCompedLifetimePlan
              ? () => setIsKeepPlanOpen(true)
              : undefined
          }
          secondaryAction={
            canCancel ? (
              <Button variant="ghost" onClick={() => setIsCancelOpen(true)}>
                {t('Cancel subscription')}
              </Button>
            ) : null
          }
        />
      )}

      {!isCommunity && (
        <CreditsCard info={info}>
          {isPaid &&
            isNil(info.trialEndsAt) &&
            !isNil(displayedCreditsFeature) && (
              <AutoRechargeCard
                feature={displayedCreditsFeature}
                hasCard={hasBillingPortal}
                note={autoRechargeNote}
              />
            )}
        </CreditsCard>
      )}

      {!isCommunity && !isNil(seatsFeature) && (
        <UsersCard info={info} feature={seatsFeature} />
      )}

      <Panel
        title={licenseKeyCopy.title}
        description={licenseKeyCopy.description}
      >
        <LicenseKey
          platform={platform}
          isSelfHosted={edition === ApEdition.ENTERPRISE}
          isTrialKey={isTrialKeySection}
        />
      </Panel>

      {deactivateUsersDialog}
      <CancelSubscriptionDialog
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        title={t('We are sorry to see you go')}
        confirmText={t('Cancel subscription')}
        warning={planSelectorUtils.dropToFreeWarning(info.additionalSeats)}
        onConfirm={cancelWithSeatCheck}
      />
      <KeepPlanDialog
        open={isKeepPlanOpen}
        onOpenChange={setIsKeepPlanOpen}
        info={info}
      />
    </Page>
  );
}

function licenseKeySectionCopy({
  hasLicenseKey,
  isCloud,
}: {
  hasLicenseKey: boolean;
  isCloud: boolean;
}): { title: string; description: string } {
  if (hasLicenseKey) {
    return {
      title: t('License key'),
      description: t(
        'Your custom plan is active. Enter a new license key here if we sent you an updated one.',
      ),
    };
  }
  if (isCloud) {
    return {
      title: t('Trial key'),
      description: t('Got a trial key from our team? Activate it here.'),
    };
  }
  return {
    title: t('Have a custom plan?'),
    description: t(
      'For custom enterprise plans, activate it with the license key we sent you. If you subscribed here, you can ignore this.',
    ),
  };
}

type PlanTabProps = {
  platform: ReturnType<typeof platformHooks.useCurrentPlatform>['platform'];
  info: PlatformBillingInformation;
};
