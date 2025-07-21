import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

import { TableTitle } from '@/components/custom/table-title';
import { Skeleton } from '@/components/ui/skeleton';
import { aiProviderApi } from '@/features/platform-admin/lib/ai-provider-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';
import {
  SUPPORTED_AI_PROVIDERS,
  PlatformRole,
  ApFlagId,
} from '@activepieces/shared';

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
  const { data: canConfigureAIProvider } = flagsHooks.useFlag(
    ApFlagId.CAN_CONFIGURE_AI_PROVIDER,
  );
  const allowWrite = canConfigureAIProvider === true;

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
        <div>
          <div className="flex justify-between flex-row w-full">
            <TableTitle
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
              {t('AI Providers')}
            </TableTitle>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {SUPPORTED_AI_PROVIDERS.map((metadata) => {
            const isConfigured =
              providers?.data.some((p) => p.provider === metadata.provider) ??
              false;

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
              />
            );
          })}
        </div>

        <div>
          <div className="mb-4 flex">
            <div className="flex justify-between flex-row w-full">
              <div className="flex flex-col gap-2">
                <TableTitle>{t('Copilot')}</TableTitle>
              </div>
            </div>
          </div>
          <CopilotSetup />
        </div>
      </div>
    </LockedFeatureGuard>
  );
}
