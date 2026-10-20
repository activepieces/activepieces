import { ApEdition, ApFlagId } from '@activepieces/shared';
import { Navigate } from 'react-router-dom';

import { AdminPage } from '@/app/components/admin';
import { flagsHooks } from '@/hooks/flags-hooks';

import { CapabilitiesTab } from './capabilities-tab';
import { ProvidersTab } from './providers-tab';
import { TiersTab } from './tiers-tab';
import { UsageTab } from './usage-tab';

export default function AIProvidersPage({ section }: AIProvidersPageProps) {
  return <AICenter section={section} />;
}

function AICenter({ section }: { section: AISection }) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  if (section === 'capabilities' && edition === ApEdition.COMMUNITY) {
    return <Navigate to="/platform/ai" replace />;
  }

  return (
    <AdminPage width="wide">
      {section === 'providers' ? (
        <ProvidersTab />
      ) : section === 'tiers' ? (
        <TiersTab />
      ) : section === 'usage' ? (
        <UsageTab />
      ) : (
        <CapabilitiesTab />
      )}
    </AdminPage>
  );
}

type AISection = 'providers' | 'capabilities' | 'tiers' | 'usage';

type AIProvidersPageProps = {
  section: AISection;
};
