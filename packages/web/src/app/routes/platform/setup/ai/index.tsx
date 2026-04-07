import { PlatformRole, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowLeft, ArrowLeftRight } from 'lucide-react';
import { useState } from 'react';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { Button } from '@/components/ui/button';
import { SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import {
  aiProviderQueries,
  aiProviderMutations,
} from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';

import LockedFeatureGuard from '../../../../components/locked-feature-guard';

import { AiProviderMigrationsTable } from './model-migration/ai-provider-migrations-table';
import { MigrateFlowsDialog } from './model-migration/migrate-flows-dialog';
import { AIProviderCard } from './universal-pieces/ai-provider-card';

export default function AIProvidersPage() {
  const { data: providers, refetch } = aiProviderQueries.useAiProviders();
  const { data: currentUser } = userHooks.useCurrentUser();
  const { data: flags } = flagsHooks.useFlags();
  const allowWrite = flags?.[ApFlagId.CAN_CONFIGURE_AI_PROVIDER] === true;
  const [view, setView] = useState<'providers' | 'migrations'>('providers');
  const [migrateDialogOpen, setMigrateDialogOpen] = useState(false);

  const { mutateAsync: deleteProvider } =
    aiProviderMutations.useDeleteAiProvider({
      onSuccess: () => refetch(),
    });

  return (
    <LockedFeatureGuard
      featureKey="UNIVERSAL_AI"
      locked={currentUser?.platformRole !== PlatformRole.ADMIN}
      lockTitle={t('Unlock AI')}
      lockDescription={t(
        'Set your AI providers so your users enjoy a seamless building experience with our universal AI pieces',
      )}
    >
      {view === 'providers' ? (
        <div className="flex flex-col w-full gap-4">
          <DashboardPageHeader
            title={t('AI Providers')}
            description={
              allowWrite
                ? t(
                    'Set provider credentials that will be used by universal AI pieces, i.e Text AI.',
                  )
                : t(
                    'Available AI providers that will be used by universal AI pieces, i.e Text AI.',
                  )
            }
          >
            {allowWrite && providers && providers?.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setView('migrations')}
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  {t('Migrations')}
                </Button>
              </div>
            )}
          </DashboardPageHeader>
          <div className="flex flex-col gap-4 px-4">
            {SUPPORTED_AI_PROVIDERS.map((providerDef) => {
              const config = providers?.find(
                (p) => p.provider === providerDef.provider,
              );

              return (
                <AIProviderCard
                  key={providerDef.provider}
                  providerInfo={providerDef}
                  providerConfig={config}
                  onDelete={(id) => deleteProvider(id)}
                  onSave={() => refetch()}
                  allowWrite={allowWrite}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col w-full gap-4">
          <DashboardPageHeader title={t('Migrations')}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('providers')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('Back')}
            </Button>
          </DashboardPageHeader>
          <AiProviderMigrationsTable
            showMigrateButton={allowWrite && (providers?.length ?? 0) > 0}
            onMigrateClick={() => setMigrateDialogOpen(true)}
          />
        </div>
      )}
      {providers && (
        <MigrateFlowsDialog
          providers={providers}
          open={migrateDialogOpen}
          onOpenChange={setMigrateDialogOpen}
        />
      )}
    </LockedFeatureGuard>
  );
}
