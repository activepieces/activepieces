import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { aiProviderApi } from '@/features/platform-admin/lib/ai-provider-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { SUPPORTED_AI_PROVIDERS } from '@activepieces/common-ai';
import { PlatformRole, ApFlagId, ApEdition } from '@activepieces/shared';

import LockedFeatureGuard from '../../../../components/locked-feature-guard';

import { CopilotSetup } from './copilot';
import { AIProviderCard } from './universal-pieces/ai-provider-card';

export default function AIProvidersPage() {
  const {
    data: providers,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: () => aiProviderApi.list(),
  });
  const { data: currentUser } = userHooks.useCurrentUser();
  const { data: flags } = flagsHooks.useFlags();
  const allowWrite = flags?.[ApFlagId.CAN_CONFIGURE_AI_PROVIDER] === true;
  const edition = flags?.[ApFlagId.EDITION];

  const { mutate: deleteProvider, isPending: isDeleting } = useMutation({
    mutationFn: (provider: string) => aiProviderApi.delete(provider),
    onSuccess: () => {
      refetch();
    },
  });

  return (
    <LockedFeatureGuard
      featureKey="UNIVERSAL_AI"
      locked={currentUser?.platformRole !== PlatformRole.ADMIN}
      lockTitle={t('Unlock AI')}
      lockDescription={t(
        'Set your AI providers & copilot settings so your users enjoy a seamless building experience with our universal AI pieces',
      )}
    >
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
        ></DashboardPageHeader>
        <div className="flex flex-col gap-4">
          {SUPPORTED_AI_PROVIDERS.map((metadata) => {
            const isConfigured =
              providers?.data.some((p) => p.provider === metadata.provider) ??
              false;
            const showAzureOpenAI =
              metadata.provider === 'openai' &&
              edition === ApEdition.ENTERPRISE;

            return isLoading ? (
              <Skeleton key={metadata.provider} className="h-24 w-full" />
            ) : (
              <AIProviderCard
                key={metadata.provider}
                providerMetadata={metadata}
                isConfigured={isConfigured}
                isDeleting={isDeleting}
                onDelete={() => deleteProvider(metadata.provider)}
                onSave={() => refetch()}
                allowWrite={allowWrite}
                showAzureOpenAI={showAzureOpenAI}
              />
            );
          })}
        </div>

        <CopilotSetup />
      </div>
    </LockedFeatureGuard>
  );
}
