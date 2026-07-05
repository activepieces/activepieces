import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  AutumnFeatureId,
  PlanName,
  PlatformBillingInformation,
} from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import React from 'react';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  CurrentSubscriptionCard,
  CreditsCard,
  CreditsInfoDialog,
  AutoRechargeCard,
  DROP_TO_FREE_MESSAGE,
  DROP_TO_FREE_WARNING,
  LicenseKey,
  billingMutations,
  billingQueries,
  useManagePlanDialogStore,
} from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

export default function Billing() {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  return (
    <LockedFeatureGuard
      featureKey="BILLING"
      locked={edition === ApEdition.COMMUNITY}
      lockTitle={t('Unlock Billing Page')}
      lockDescription={t(
        'Switch to the Enterprise edition to access billing and usage management.',
      )}
      lockDocumentationUrl="https://www.activepieces.com/docs/install/configuration/overview#enterprise-edition-optional"
      showContactSales={false}
    >
      <BillingPageDetails />
    </LockedFeatureGuard>
  );
}

function BillingPageDetails() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { openDialog } = useManagePlanDialogStore();

  const {
    data: info,
    isLoading,
    isError,
  } = billingQueries.usePlatformSubscription(platform.id);
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCommunity = edition === ApEdition.COMMUNITY;
  const { mutate: redirectToPortalSession, isPending: isOpeningPortal } =
    billingMutations.usePortalLink();
  const { mutate: reactivateSubscription, isPending: isReactivating } =
    billingMutations.useReactivateSubscription();
  const { mutateAsync: cancelSubscription } =
    billingMutations.useCancelSubscription();

  if (isLoading || isNil(info)) {
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

  const isPaid =
    !isNil(info.currentPlanId) && info.currentPlanId !== PlanName.FREE;
  const creditsFeature = info.topUpFeatures.find(
    (feature) => feature.featureId === AutumnFeatureId.AP_CREDITS,
  );
  const creditsAutoTopUp = info.autoTopUps.find(
    (config) => config.featureId === AutumnFeatureId.AP_CREDITS,
  );
  const hasBillingPortal = info.billingPortalAvailable;

  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-medium">{t('Billing & subscription')}</h1>
        <div className="text-sm text-muted-foreground">
          {t(
            'For questions about billing contact us at support@activepieces.com',
          )}
        </div>
      </div>
      <Separator />
      <div className="flex flex-col gap-6">
        {!isCommunity && (
          <BillingSection
            title={t('Current subscription')}
            description={
              <div className="flex flex-col gap-2">
                <span>
                  {t('Your current plan is {plan}.', {
                    plan: info.currentPlanName ?? t('Free'),
                  })}{' '}
                  {t(
                    'Upgrade anytime to get more credits and unlock features.',
                  )}
                </span>
                <LinkButton onClick={openDialog}>
                  {t('Explore plans')}
                </LinkButton>
              </div>
            }
          >
            <CurrentSubscriptionCard info={info} onExplorePlans={openDialog} />
            <SubscriptionScheduleNotice info={info} />
          </BillingSection>
        )}

        {!isCommunity && <Separator />}

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
            {isPaid && !isNil(creditsFeature) && (
              <AutoRechargeCard
                feature={creditsFeature}
                autoTopUp={creditsAutoTopUp}
                includedCredits={info.plan.includedCredits}
              />
            )}
          </BillingSection>
        )}

        {isPaid && (
          <>
            <Separator />
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
                    <ExternalLink className="size-3.5 ml-2" />
                  </Button>
                )}
                {isNil(info.cancelAt) ? (
                  <ConfirmationDeleteDialog
                    title={t('Cancel subscription')}
                    message={t(DROP_TO_FREE_MESSAGE)}
                    warning={t(DROP_TO_FREE_WARNING)}
                    buttonText={t('Cancel subscription')}
                    entityName={t('subscription')}
                    mutationFn={async () => {
                      await cancelSubscription();
                    }}
                  >
                    <Button
                      variant="link"
                      className="text-destructive hover:text-destructive"
                    >
                      {t('Cancel subscription')}
                    </Button>
                  </ConfirmationDeleteDialog>
                ) : (
                  <Button
                    variant="default"
                    className="w-full"
                    loading={isReactivating}
                    onClick={() => reactivateSubscription()}
                  >
                    {t('Keep current plan')}
                  </Button>
                )}
              </div>
            </BillingSection>
          </>
        )}

        <Separator />
        <LicenseKey platform={platform} />
      </div>
    </div>
  );
}

const BillingSection = ({
  title,
  description,
  children,
}: {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_400px] md:gap-20 pr-4">
    <div className="flex flex-col gap-1">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="text-sm text-muted-foreground">{description}</div>
    </div>
    <div className="flex flex-col gap-3">{children}</div>
  </section>
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
    <span className="text-sm text-muted-foreground">
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
    className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline"
  >
    {children}
    <ArrowUpRight className="size-3.5" />
  </button>
);
