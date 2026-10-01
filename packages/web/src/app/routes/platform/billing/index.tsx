import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  PlanName,
  PlatformBillingInformation,
} from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { ArrowUpRight, ExternalLink, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { BillingPageShell } from '@/app/components/billing-page-shell';
import { Page, PageHeader, PageSection } from '@/components/custom/page';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  CurrentSubscriptionCard,
  CreditsCard,
  CreditsInfoDialog,
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
      {({ platform, info }) => (
        <Page width="narrow">
          <PageHeader
            title={t('Billing & subscription')}
            description={t(
              'For questions about billing contact us at support@activepieces.com',
            )}
          >
            <BillingRefreshButton />
          </PageHeader>
          <PlanTab platform={platform} info={info} />
        </Page>
      )}
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
  const { mutate: redirectToPortalSession, isPending: isOpeningPortal } =
    billingMutations.usePortalLink();
  const [isKeepPlanOpen, setIsKeepPlanOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const { cancelWithSeatCheck, deactivateUsersDialog } =
    useCancelSubscriptionGuard();

  const isCloud = edition === ApEdition.CLOUD;

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
  const hasLicenseKey = !isNil(platform.plan.licenseKey);
  const isTrialKeySection = isCloud && !hasLicenseKey;
  const licenseKeyCopy = licenseKeySectionCopy({ hasLicenseKey, isCloud });

  return (
    <>
      {info.billingUnavailable && (
        <Alert variant="warning">
          <AlertDescription>
            {t(
              'Our billing service is temporarily unavailable, so plan and credit details may be out of date. Your flows keep running — we are working on a fix.',
            )}
          </AlertDescription>
        </Alert>
      )}
      {!isCommunity && (
        <BillingSection
          title={t('Current subscription')}
          description={
            <div className="flex flex-col gap-2">
              <span>
                {t('Your current plan is {plan}.', {
                  plan: info.autumnPlanName ?? t('Free'),
                })}{' '}
                {t('Upgrade anytime to get more credits and unlock features.')}
              </span>
              <LinkButton onClick={openDialog}>{t('Explore plans')}</LinkButton>
            </div>
          }
        >
          <CurrentSubscriptionCard info={info} onExplorePlans={openDialog} />
          <SubscriptionScheduleNotice info={info} />
        </BillingSection>
      )}

      {!isCommunity && (
        <BillingSection
          title={t('Credits')}
          description={
            <div className="flex flex-col gap-2">
              <span>
                {t(
                  'Credits are what you spend to run flows, AI steps, and chat. See how they add up and how to get more.',
                )}
              </span>
              <CreditsInfoDialog />
            </div>
          }
        >
          <CreditsCard info={info} />
          {isPaid &&
            isNil(info.trialEndsAt) &&
            !isNil(displayedCreditsFeature) && (
              <AutoRechargeCard
                feature={displayedCreditsFeature}
                hasCard={hasBillingPortal}
                note={autoRechargeNote}
              />
            )}
        </BillingSection>
      )}

      {!isCommunity && !isNil(seatsFeature) && (
        <BillingSection
          title={t('Seats')}
          description={t(
            'Manage how many members can join your platform. New seats are available immediately.',
          )}
        >
          <UsersCard info={info} feature={seatsFeature} />
        </BillingSection>
      )}

      {isPaid && !isComped && (
        <BillingSection
          title={t('Manage subscription')}
          description={t(
            'Update your payment method, review your past invoices, cancel your subscription.',
          )}
        >
          <div className="flex flex-col items-center gap-3">
            {hasBillingPortal && (
              <Button
                variant="outline"
                className="w-full"
                loading={isOpeningPortal}
                onClick={() => redirectToPortalSession()}
              >
                {t('Manage subscription in Stripe')}
                <ExternalLink />
              </Button>
            )}
            {!isCompedLifetimePlan &&
              (isNil(info.cancelAt) ? (
                <Button
                  variant="link"
                  className="text-danger-11 hover:text-danger-11"
                  onClick={() => setIsCancelOpen(true)}
                >
                  {t('Cancel subscription')}
                </Button>
              ) : (
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => setIsKeepPlanOpen(true)}
                >
                  {t('Keep current plan')}
                </Button>
              ))}
          </div>
        </BillingSection>
      )}

      <BillingSection
        title={licenseKeyCopy.title}
        description={licenseKeyCopy.description}
      >
        <LicenseKey
          platform={platform}
          isSelfHosted={edition === ApEdition.ENTERPRISE}
          isTrialKey={isTrialKeySection}
        />
      </BillingSection>
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
    </>
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
      title: t('Trial Keys'),
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

const BillingSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <PageSection title={title} description={description}>
    <div className="flex flex-col gap-3">{children}</div>
  </PageSection>
);

const SubscriptionScheduleNotice = ({
  info,
}: {
  info: PlatformBillingInformation;
}) => {
  if (isNil(info.cancelAt)) {
    return null;
  }
  const date = dayjsCancelDate(info.cancelAt);
  return (
    <span className="text-sm text-gray-11">
      {!isNil(info.scheduledPlanName)
        ? t('Switches to {plan} on {date}', {
            plan: info.scheduledPlanName,
            date,
          })
        : t('Subscription will end on {date}', { date })}
    </span>
  );
};

function dayjsCancelDate(cancelAt: string): string {
  return dayjs(cancelAt).format('MMM D, YYYY');
}

const LinkButton = ({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex w-fit items-center gap-1 text-sm font-medium text-accent-11 hover:underline"
  >
    {children}
    <ArrowUpRight className="size-4" />
  </button>
);

type PlanTabProps = {
  platform: ReturnType<typeof platformHooks.useCurrentPlatform>['platform'];
  info: PlatformBillingInformation;
};
