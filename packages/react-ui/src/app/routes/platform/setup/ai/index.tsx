import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { aiProviderApi } from '@/features/platform-admin/lib/ai-provider-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { PlatformRole, ApFlagId } from '@activepieces/shared';

import LockedFeatureGuard from '../../../../components/locked-feature-guard';

import { AIProviderCard } from './universal-pieces/ai-provider-card';

import { CreateNewProviderButton } from './universal-pieces/create-new-provider-button';

export default function AIProvidersPage() {
  const { data: providers, refetch } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: () => aiProviderApi.list(),
  });
  const { data: currentUser } = userHooks.useCurrentUser();
  const { data: flags } = flagsHooks.useFlags();
  const allowWrite = flags?.[ApFlagId.CAN_CONFIGURE_AI_PROVIDER] === true;

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
        'Set your AI providers so your users enjoy a seamless building experience with our universal AI pieces'
      )}
    >
      <div className="flex flex-col w-full gap-4">
        <DashboardPageHeader
          title={t('AI Providers')}
          description={
            allowWrite
              ? t(
                  'Set provider credentials that will be used by universal AI pieces, i.e Text AI.'
                )
              : t(
                  'Available AI providers that will be used by universal AI pieces, i.e Text AI.'
                )
          }
        >
          {allowWrite && <CreateNewProviderButton onSave={() => refetch()} />}
        </DashboardPageHeader>
        <div className="flex flex-col gap-4">
          {providers && providers.length > 0 ? (
            providers.map((provider) => (
              <AIProviderCard
                key={provider.id}
                provider={provider}
                isDeleting={isDeleting}
                onDelete={() => deleteProvider(provider.id)}
                onSave={() => refetch()}
                allowWrite={allowWrite}
              />
            ))
          ) : (
            <div className="text-center py-10">
              <div className="text-muted-foreground mb-4">
                {t('No AI providers configured yet.')}
              </div>
              {allowWrite && (
                <CreateNewProviderButton onSave={() => refetch()} />
              )}
            </div>
          )}
        </div>
      </div>
    </LockedFeatureGuard>
  );
}
