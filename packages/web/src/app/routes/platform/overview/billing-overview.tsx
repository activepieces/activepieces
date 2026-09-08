import { t } from 'i18next';

import { billingQueries } from '@/features/billing';
import { platformHooks } from '@/hooks/platform-hooks';

import { AdminOverview, OverviewCard, OverviewCards } from './overview-shell';

export function BillingOverview() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: subscription, isLoading } =
    billingQueries.usePlatformSubscription(platform.id);

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
          description={t('{credits} credits included', {
            credits: creditsLimit.toLocaleString(),
          })}
        />
        <OverviewCard
          to="/platform/setup/billing?tab=usage"
          title={t('Usage')}
          value={`${usedPercent}%`}
          isLoading={isLoading}
          description={t('{used} of {total} credits used this period', {
            used: creditsUsed.toLocaleString(),
            total: creditsLimit.toLocaleString(),
          })}
        />
      </OverviewCards>
    </AdminOverview>
  );
}
