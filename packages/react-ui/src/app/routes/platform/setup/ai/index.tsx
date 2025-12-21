import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useMemo } from 'react';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { aiProviderApi } from '@/features/platform-admin/lib/ai-provider-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { AIProviderName, PlatformRole, ApFlagId } from '@activepieces/shared';

import LockedFeatureGuard from '../../../../components/locked-feature-guard';

import { AIProviderCard } from './universal-pieces/ai-provider-card';

const getSupportedAIProviders = () => [
  {
    provider: AIProviderName.OPENAI,
    displayName: 'OpenAI',
    markdown: t('aiProviders.openai.instructions'),
    logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
  },
  {
    provider: AIProviderName.ANTHROPIC,
    displayName: 'Anthropic',
    markdown: t('aiProviders.anthropic.instructions'),
    logoUrl: 'https://cdn.activepieces.com/pieces/claude.png',
  },
  {
    provider: AIProviderName.GOOGLE,
    displayName: 'Google Gemini',
    markdown: t('aiProviders.google.instructions'),
    logoUrl: 'https://cdn.activepieces.com/pieces/google-gemini.png',
  },
  {
    provider: AIProviderName.AZURE,
    displayName: 'Azure',
    logoUrl: 'https://cdn.activepieces.com/pieces/azure-openai.png',
    markdown: t('aiProviders.azure.instructions'),
  },
  {
    provider: AIProviderName.OPENROUTER,
    displayName: 'OpenRouter',
    logoUrl: 'https://cdn.activepieces.com/pieces/openrouter.jpg',
    markdown: t('aiProviders.openrouter.instructions'),
  },
];

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

  const supportedProviders = useMemo(() => getSupportedAIProviders(), []);

  return (
    <LockedFeatureGuard
      featureKey="UNIVERSAL_AI"
      locked={currentUser?.platformRole !== PlatformRole.ADMIN}
      lockTitle={t('Unlock AI')}
      lockDescription={t(
        'Set your AI providers so your users enjoy a seamless building experience with our universal AI pieces',
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
          {supportedProviders.map((provider) => (
            <AIProviderCard
              key={provider.provider}
              provider={provider.provider}
              displayName={provider.displayName}
              logoUrl={provider.logoUrl}
              markdown={provider.markdown}
              configured={
                providers?.find((p) => p.id === provider.provider)
                  ?.configured ?? false
              }
              isDeleting={isDeleting}
              onDelete={() => deleteProvider(provider.provider)}
              onSave={() => refetch()}
            />
          ))}
        </div>
      </div>
    </LockedFeatureGuard>
  );
}
