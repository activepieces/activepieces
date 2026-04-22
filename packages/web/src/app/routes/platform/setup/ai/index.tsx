import { PlatformRole } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowLeftRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

import { AIProviderCard } from './universal-pieces/ai-provider-card';

export default function AIProvidersPage() {
  const navigate = useNavigate();
  const { data: providers, refetch } = aiProviderQueries.useAiProviders();
  const { data: currentUser } = userHooks.useCurrentUser();
  const {
    platform: {
      plan: { aiProvidersEnabled },
    },
  } = platformHooks.useCurrentPlatform();

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
              onClick={() => navigate('/platform/setup/ai/migrations')}
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
    </LockedFeatureGuard>
  );
}
