import { ApEdition, ApFlagId, PlatformRole } from '@activepieces/shared';
import { t } from 'i18next';
import { Navigate } from 'react-router-dom';

import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';

import { LockedFeatureGuard } from '../../../../components/locked-feature-guard';

import { CapabilitiesTab } from './capabilities-tab';
import { ProvidersTab } from './providers-tab';

export default function AIProvidersPage({ section }: AIProvidersPageProps) {
  const { data: currentUser } = userHooks.useCurrentUser();

  return (
    <LockedFeatureGuard
      featureKey="UNIVERSAL_AI"
      locked={currentUser?.platformRole !== PlatformRole.ADMIN}
      lockTitle={t('Unlock AI')}
      lockDescription={t(
        'Set your AI providers so your users enjoy a seamless building experience with our universal AI pieces',
      )}
    >
      <AICenter section={section} />
    </LockedFeatureGuard>
  );
}

function AICenter({ section }: { section: AISection }) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  if (section === 'capabilities' && edition === ApEdition.COMMUNITY) {
    return <Navigate to="/platform/setup/ai" replace />;
  }

  return (
    <div className="flex w-full flex-1 min-h-0 flex-col overflow-auto">
      <div className="flex min-h-full w-full max-w-6xl flex-col px-8 py-6">
        <div className="flex flex-col gap-1 pb-6">
          <h1 className="text-lg font-semibold tracking-tight">
            {t('AI Center')}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t('Providers and capabilities for your platform.')}
          </p>
        </div>
        {section === 'providers' ? (
          <div className="flex flex-1 flex-col">
            <ProvidersTab />
          </div>
        ) : (
          <CapabilitiesTab />
        )}
      </div>
    </div>
  );
}

type AISection = 'providers' | 'capabilities';

type AIProvidersPageProps = {
  section: AISection;
};
