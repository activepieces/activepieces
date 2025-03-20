import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

import { Skeleton } from '@/components/ui/skeleton';
import { TableTitle } from '@/components/ui/table-title';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { aiProviderApi } from '@/features/platform-admin-panel/lib/ai-provider-api';
import { userHooks } from '@/hooks/user-hooks';
import { AI_PROVIDERS } from '@activepieces/pieces-common';
import { PlatformRole } from '@activepieces/shared';

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

  const { mutate: deleteProvider, isPending: isDeleting } = useMutation({
    mutationFn: (provider: string) => aiProviderApi.delete(provider),
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  return (
    <LockedFeatureGuard
      featureKey="UNIVERSAL_AI"
      locked={currentUser?.platformRole !== PlatformRole.ADMIN}
      lockTitle={t('Unlock AI')}
      lockDescription={t(
        'Set your AI providers & copilot settings so your users enjoy a seamless building experience with our univeral AI pieces',
      )}
    >
      <div className="flex flex-col w-full gap-4">
        <div>
          <div className="flex justify-between flex-row w-full">
            <TableTitle
              description={t(
                'Set provider credentials that will be used by universal AI pieces, i.e Text AI.',
              )}
            >
              {t('AI Providers')}
            </TableTitle>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {AI_PROVIDERS.map((metadata) => {
            const provider = providers?.data.find(
              (c) => c.provider === metadata.value,
            );
            return isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <AIProviderCard
                providerMetadata={metadata}
                defaultBaseUrl={provider?.baseUrl ?? metadata.defaultBaseUrl}
                provider={
                  provider
                    ? { ...provider, config: { defaultHeaders: {} } }
                    : undefined
                }
                isDeleting={isDeleting}
                onDelete={() => deleteProvider(metadata.value)}
                onSave={() => refetch()}
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
