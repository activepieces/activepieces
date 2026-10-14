import { ApEdition, ApFlagId } from '@activepieces/shared';
import { Navigate, useSearchParams } from 'react-router-dom';

import { AdminPage } from '@/app/components/admin';
import { flagsHooks } from '@/hooks/flags-hooks';

import { CapabilitiesTab } from './capabilities-tab';
import { ProvidersTab } from './providers-tab';
import { TiersTab } from './tiers-tab';

export default function AIProvidersPage({ section }: AIProvidersPageProps) {
  return <AICenter section={section} />;
}

function AICenter({ section }: { section: AISection }) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const [searchParams] = useSearchParams();
  const showsSettings =
    section === 'capabilities' || searchParams.has('config');

  if (section === 'capabilities' && edition === ApEdition.COMMUNITY) {
    return <Navigate to="/platform/ai" replace />;
  }

  return (
    <AdminPage width={showsSettings ? 'content' : 'full'}>
      {section === 'providers' ? (
        <ProvidersTab />
      ) : section === 'tiers' ? (
        <TiersTab />
      ) : (
        <CapabilitiesTab />
      )}
    </AdminPage>
  );
}

type AISection = 'providers' | 'capabilities' | 'tiers';

type AIProvidersPageProps = {
  section: AISection;
};
