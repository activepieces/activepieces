import {
  AIProviderName,
  AIProviderWithoutSensitiveData,
  PlatformRole,
} from '@activepieces/shared';
import { t } from 'i18next';
import { MessageSquare } from 'lucide-react';

import { CenteredPage } from '@/app/components/centered-page';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_AI_PROVIDERS, AiProviderInfo } from '@/features/agents';
import {
  aiProviderQueries,
  aiProviderMutations,
} from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';

import LockedFeatureGuard from '../../../../components/locked-feature-guard';

import { AIProviderCard } from './universal-pieces/ai-provider-card';

const ACTIVEPIECES_LOGO_URL =
  'https://cdn.activepieces.com/pieces/activepieces.png';

export default function AIProvidersPage() {
  const { data: providers, refetch } = aiProviderQueries.useAiProviders();
  const { data: currentUser } = userHooks.useCurrentUser();
  const { platform } = platformHooks.useCurrentPlatform();
  const allowWrite = platform.plan.aiProvidersEnabled;

  const { mutateAsync: deleteProvider } =
    aiProviderMutations.useDeleteAiProvider({
      onSuccess: () => refetch(),
    });

  const { mutateAsync: toggleChatProvider } =
    aiProviderMutations.useToggleChatProvider({
      onSuccess: () => refetch(),
    });

  const configuredProviders = providers ?? [];
  const chatProvider = providers?.find((p) => p.enabledForChat);

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
          allowWrite
            ? t(
                'Set provider credentials that will be used by universal AI pieces, i.e Text AI.',
              )
            : t(
                'Available AI providers that will be used by universal AI pieces, i.e Text AI.',
              )
        }
      >
        {allowWrite && configuredProviders.length > 0 && (
          <ChatProviderSelector
            providers={configuredProviders}
            providerInfos={SUPPORTED_AI_PROVIDERS}
            selectedProviderId={chatProvider?.id ?? null}
            onSelect={(providerId, displayName) =>
              toggleChatProvider({ providerId, displayName })
            }
          />
        )}

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
                allowWrite={allowWrite}
              />
            );
          })}
        </div>
      </CenteredPage>
    </LockedFeatureGuard>
  );
}

function ChatProviderSelector({
  providers,
  providerInfos,
  selectedProviderId,
  onSelect,
}: {
  providers: AIProviderWithoutSensitiveData[];
  providerInfos: AiProviderInfo[];
  selectedProviderId: string | null;
  onSelect: (providerId: string, displayName: string) => void;
}) {
  const getLogoUrl = (providerName: string) =>
    providerInfos.find((p) => p.provider === providerName)?.logoUrl ??
    (providerName === AIProviderName.ACTIVEPIECES
      ? ACTIVEPIECES_LOGO_URL
      : undefined);

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4 mb-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
        <MessageSquare className="size-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-none">{t('Chat Provider')}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('Select which AI provider powers the chat feature')}
        </p>
      </div>
      <Select
        value={selectedProviderId ?? undefined}
        onValueChange={(value) => {
          const provider = providers.find((p) => p.id === value);
          if (provider) onSelect(provider.id, provider.name);
        }}
      >
        <SelectTrigger className="w-52">
          <SelectValue placeholder={t('Select provider')} />
        </SelectTrigger>
        <SelectContent>
          {providers.map((provider) => {
            const logoUrl = getLogoUrl(provider.provider);
            return (
              <SelectItem key={provider.id} value={provider.id}>
                <div className="flex items-center gap-2">
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt={provider.provider}
                      className="size-4 object-contain"
                    />
                  )}
                  <span>{provider.name}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
