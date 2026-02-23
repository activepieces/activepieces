import { t } from 'i18next';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { Skeleton } from '@/components/ui/skeleton';
import { secretManagersHooks } from '@/features/secret-managers/lib/secret-managers-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import SecretManagerProviderCard from './secret-manager-provider-card';

const SecretMangersPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: secretManagerProviders, isLoading } =
    secretManagersHooks.useListSecretManagers();

  return (
    <LockedFeatureGuard
      featureKey="SECRET_MANAGERS"
      locked={!platform.plan.secretManagersEnabled}
      lockTitle={t('Enable Secret Managers')}
      lockDescription={t('Manage your secrets from a single and secure place')}
    >
      <div className="flex-col w-full">
        <DashboardPageHeader
          title={t('Secret Managers')}
          description={t('Manage Secret Managers')}
        ></DashboardPageHeader>
        {isLoading ? (
          <Skeleton className="w-full h-10 flex flex-col gap-4" />
        ) : (
          secretManagerProviders?.map((provider) => (
            <SecretManagerProviderCard key={provider.id} provider={provider} />
          ))
        )}
      </div>
    </LockedFeatureGuard>
  );
};

export default SecretMangersPage;
