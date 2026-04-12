import { PlatformRole } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowLeft, ArrowLeftRight } from 'lucide-react';
import { useState } from 'react';

import { CenteredPage } from '@/app/components/centered-page';
import { Button } from '@/components/ui/button';
import { SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import {
  aiProviderQueries,
  aiProviderMutations,
} from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';

import LockedFeatureGuard from '../../../../components/locked-feature-guard';

import { AiProviderMigrationsTable } from './model-migration/ai-provider-migrations-table';
import { MigrateFlowsDialog } from './model-migration/migrate-flows-dialog';
import { AIProviderCard } from './universal-pieces/ai-provider-card';

export default function AIProvidersPage() {
  const { data: providers, refetch } = aiProviderQueries.useAiProviders();
  const { data: currentUser } = userHooks.useCurrentUser();
  const [view, setView] = useState<'providers' | 'migrations'>('providers');
  const [migrateDialogOpen, setMigrateDialogOpen] = useState(false);
  const { platform: { plan:{aiProvidersEnabled}} } = platformHooks.useCurrentPlatform();

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
        <CenteredPage
          title={t('AI Providers')}
          description={
            aiProvidersEnabled
              ? t(
                  'Set provider credentials that will be used by universal AI pieces, i.e Text AI.',
                )
              : t(
                  'Available AI providers that will be used by universal AI pieces, i.e Text AI.',
                )
          }
          actions={
            aiProvidersEnabled && providers && providers?.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView('migrations')}
              >
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                {t('Migrations')}
              </Button>
            ) : undefined
          }
        >
          <div className="flex flex-col gap-4">
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
                  allowWrite={aiProvidersEnabled}
                />
              );
            })}
          </div>
        </CenteredPage>
      ) : (
        <CenteredPage
          title={t('Migrations')}
          description={t('View migration history and track progress.')}
          maxWidth="max-w-[75rem]"
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('providers')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('Back')}
            </Button>
          }
        >
          <AiProviderMigrationsTable
            showMigrateButton={aiProvidersEnabled && (providers?.length ?? 0) > 0}
            onMigrateClick={() => setMigrateDialogOpen(true)}
          />
        </CenteredPage>
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
