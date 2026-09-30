import { ApEdition, ApFlagId } from '@activepieces/shared';
import { Navigate } from 'react-router-dom';

import { flagsHooks } from '@/hooks/flags-hooks';

import { CapabilitiesTab } from './capabilities-tab';
import { ProvidersTab } from './providers-tab';

export default function AIProvidersPage({ section }: AIProvidersPageProps) {
  return <AICenter section={section} />;
}

function AICenter({ section }: { section: AISection }) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  if (section === 'capabilities' && edition === ApEdition.COMMUNITY) {
    return <Navigate to="/platform/ai" replace />;
  }

  return section === 'providers' ? <ProvidersTab /> : <CapabilitiesTab />;
}

type AISection = 'providers' | 'capabilities';

type AIProvidersPageProps = {
  section: AISection;
};
