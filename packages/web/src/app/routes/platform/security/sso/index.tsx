import { t } from 'i18next';

import {
  AdminPage,
  AdminPageHeader,
  adminPageResources,
} from '@/app/components/admin';
import { AllowedDomainsSection } from '@/app/routes/platform/security/sso/allowed-domains-section';
import { DomainsSection } from '@/app/routes/platform/security/sso/domains-section';
import { SignInMethodsSection } from '@/app/routes/platform/security/sso/sign-in-methods-section';
import { platformHooks } from '@/hooks/platform-hooks';

const SSOPage = () => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();

  return (
    <AdminPage width="content">
      <AdminPageHeader
        title={t('Authentication')}
        description={t('Claim your domains and choose how people sign in.')}
        resources={adminPageResources.sso}
      />
      <DomainsSection platform={platform} refetch={refetch} />
      <SignInMethodsSection platform={platform} refetch={refetch} />
      <AllowedDomainsSection platform={platform} refetch={refetch} />
    </AdminPage>
  );
};

SSOPage.displayName = 'SSOPage';
export { SSOPage };
