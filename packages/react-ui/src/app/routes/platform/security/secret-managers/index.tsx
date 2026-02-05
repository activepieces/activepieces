import { t } from 'i18next';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { secretManagersHooks } from '@/features/secret-managers/lib/secret-managers-hooks';

import SecretManagerProviderCard from './secret-manager-provider-card';

const SecretMangersPage = () => {
  const { data: secretManagerProviders, isLoading } =
    secretManagersHooks.useSecretManagers();

  return (
    <div className="flex-col w-full">
      <DashboardPageHeader
        title={t('Secret Managers')}
        description={t('Mange Secret Managers')}
      ></DashboardPageHeader>
      {isLoading ? (
        <Skeleton className="w-full h-10" />
      ) : (
        secretManagerProviders?.map((provider) => (
          <SecretManagerProviderCard key={provider.id} provider={provider} />
        ))
      )}
    </div>
  );
};

export default SecretMangersPage;
