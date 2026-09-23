import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
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
