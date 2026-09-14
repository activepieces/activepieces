import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';

import { billingQueries } from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { AdminOverview, OverviewCard, OverviewCards } from './overview-shell';

export function BillingOverview() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCommunity = edition === ApEdition.COMMUNITY;
  const {
    data: subscription,
    isLoading,
    isError,
  } = billingQueries.usePlatformSubscription(platform.id, !isCommunity);

  const creditsUsed = subscription?.usage.creditsUsed ?? 0;
  const creditsLimit = subscription?.plan.includedCredits ?? 0;
  const usedPercent =
    creditsLimit === 0
      ? 0
      : Math.min(100, Math.round((creditsUsed / creditsLimit) * 100));

  return (
    <AdminOverview
      title={t('Billing & usage')}
      description={t('Your plan, credits and how projects consume them.')}
    >
      <OverviewCards>
        <OverviewCard
          to="/platform/setup/billing?tab=plan"
          title={t('Plan')}
          value={subscription?.autumnPlanName ?? subscription?.plan.plan ?? '—'}
          isLoading={isLoading}
          isError={isError}
          errorEntity={t('billing')}
          description={t('{credits} credits included', {
            credits: creditsLimit.toLocaleString(),
          })}
        />
        <OverviewCard
          to="/platform/setup/billing?tab=usage"
          title={t('Usage')}
          value={`${usedPercent}%`}
          isLoading={isLoading}
          isError={isError}
          errorEntity={t('billing')}
          description={t('{used} of {total} credits used this period', {
            used: creditsUsed.toLocaleString(),
            total: creditsLimit.toLocaleString(),
          })}
        />
      </OverviewCards>
    </AdminOverview>
  );
}
