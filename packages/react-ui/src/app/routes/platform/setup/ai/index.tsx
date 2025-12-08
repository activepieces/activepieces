import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { aiProviderApi } from '@/features/platform-admin/lib/ai-provider-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { AIProviderName, PlatformRole, ApFlagId } from '@activepieces/shared';

import LockedFeatureGuard from '../../../../components/locked-feature-guard';

import { AIProviderCard } from './universal-pieces/ai-provider-card';

const SUPPORTED_AI_PROVIDERS = [
  {
    provider: AIProviderName.OPENAI,
    displayName: 'OpenAI',
    markdown: `Follow these instructions to get your OpenAI API Key:

1. Visit the following website: https://platform.openai.com/account/api-keys.
2. Once on the website, locate and click on the option to obtain your OpenAI API Key.

It is strongly recommended that you add your credit card information to your OpenAI account and upgrade to the paid plan **before** generating the API Key. This will help you prevent 429 errors.
`,
    logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
  },
  {
    provider: AIProviderName.ANTHROPIC,
    displayName: 'Anthropic',
    markdown: `Follow these instructions to get your Claude API Key:

1. Visit the following website: https://console.anthropic.com/settings/keys.
2. Once on the website, locate and click on the option to obtain your Claude API Key.
`,
    logoUrl: 'https://cdn.activepieces.com/pieces/claude.png',
  },
  {
    provider: AIProviderName.GOOGLE,
    displayName: 'Google Gemini',
    markdown: `Follow these instructions to get your Google API Key:
1. Visit the following website: https://console.cloud.google.com/apis/credentials.
2. Once on the website, locate and click on the option to obtain your Google API Key.
`,
    logoUrl: 'https://cdn.activepieces.com/pieces/google-gemini.png',
  },
  {
    provider: AIProviderName.AZURE,
    displayName: 'Azure',
    logoUrl: 'https://cdn.activepieces.com/pieces/azure-openai.png',
    markdown:
      'Use the Azure Portal to browse to your OpenAI resource and retrieve an API key and resource name.',
  },
  {
    provider: AIProviderName.OPENROUTER,
    displayName: 'OpenRouter',
    logoUrl: 'https://cdn.activepieces.com/pieces/openrouter.jpg',
    markdown: `Follow these instructions to get your OpenRouter API Key:
1. Visit the following website: https://openrouter.ai/settings/keys.
2. Once on the website, locate and click on the option to obtain your OpenRouter API Key.`,
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
          {SUPPORTED_AI_PROVIDERS.map((provider) => (
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
