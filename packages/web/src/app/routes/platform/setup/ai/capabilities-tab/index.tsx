import { AIProviderName, isNil } from '@activepieces/core-utils';
import {
  AiProviderToolConfig,
  AIProviderWithoutSensitiveData,
  AiToolCapability,
  AiToolConfigWithoutSensitiveData,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Globe, Image, LucideIcon, Search } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Page, PageHeader, PageSection } from '@/components/custom/page';
import { Panel } from '@/components/custom/panel';
import { StatusDot } from '@/components/custom/status-dot';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  aiProviderQueries,
  aiToolConfigMutations,
  aiToolConfigQueries,
} from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

import { AiCapabilityDialog } from '../../ai-capabilities/ai-capability-dialog';
import {
  AI_TOOL_CATALOG,
  aiCapabilitySources,
  AiToolCapabilityInfo,
} from '../../ai-capabilities/catalog';

export function CapabilitiesTab() {
  const {
    data: configs,
    isError: configsFailed,
    refetch: refetchConfigs,
  } = aiToolConfigQueries.useAiToolConfigs();
  const {
    data: providers,
    isError: providersFailed,
    refetch: refetchProviders,
  } = aiProviderQueries.useAiProviderConfigs();
  const isError = configsFailed || providersFailed;
  const refetch = () => Promise.all([refetchConfigs(), refetchProviders()]);
  const chatProvider =
    providers?.find((provider) => provider.enabledForChat) ??
    providers?.find(
      (provider) => provider.provider === AIProviderName.ACTIVEPIECES,
    );

  const { mutate: remove } = aiToolConfigMutations.useDeleteAiToolConfig({
    onSuccess: () => refetchConfigs(),
  });

  return (
    <Page width="narrow">
      <PageHeader
        title={t('AI')}
        description={t(
          'Abilities a model does not have on its own: searching the web, reading pages and making images.',
        )}
      />
      <PageSection
        title={t('Assistant capabilities')}
        description={t(
          'External services the assistant can call. Keys are stored once, here.',
        )}
      >
        {isError ? (
          <DataFetchErrorState entity={t('AI tools')} onRetry={refetch} />
        ) : (
          AI_TOOL_CATALOG.map((capabilityInfo) => {
            const config = configs?.find(
              (c) => c.capability === capabilityInfo.capability,
            );
            return (
              <CapabilityPanel
                key={capabilityInfo.capability}
                capabilityInfo={capabilityInfo}
                config={config}
                providers={providers ?? []}
                chatProviderFallback={
                  chatProvider &&
                  aiCapabilitySources.servesByDefault({
                    capability: capabilityInfo.capability,
                    provider: chatProvider,
                  })
                    ? chatProvider
                    : undefined
                }
                onDelete={() => config && remove(config.id)}
                onSaved={() => refetchConfigs()}
              />
            );
          })
        )}
      </PageSection>
    </Page>
  );
}

function CapabilityPanel({
  capabilityInfo,
  config,
  providers,
  chatProviderFallback,
  onDelete,
  onSaved,
}: {
  capabilityInfo: AiToolCapabilityInfo;
  config?: AiToolConfigWithoutSensitiveData;
  providers: AIProviderWithoutSensitiveData[];
  chatProviderFallback?: AIProviderWithoutSensitiveData;
  onDelete: () => void;
  onSaved: () => void;
}) {
  const [resetOpen, setResetOpen] = useState(false);
  const Icon = CAPABILITY_ICON[capabilityInfo.capability];
  const connectedProvider = capabilityInfo.providers.find(
    (provider) => provider.id === config?.provider,
  );
  const providerChoice = AiProviderToolConfig.safeParse(config?.config);
  const chosenProvider = providerChoice.success
    ? providers.find((p) => p.id === providerChoice.data.aiProviderId)
    : undefined;
  const sourceName = config?.enabled
    ? chosenProvider?.name ?? connectedProvider?.name
    : chatProviderFallback?.name;
  const chosenModelId =
    config?.enabled && providerChoice.success
      ? providerChoice.data.modelId
      : undefined;
  const inUse = !isNil(sourceName);
  const configured = config?.enabled === true;
  const detail = inUse
    ? [
        configured
          ? t('Available to the assistant')
          : t('Served by the chat provider'),
        chosenModelId,
      ]
        .filter(Boolean)
        .join(' · ')
    : capabilityInfo.providers
        .map((provider) => `${provider.name} (${provider.description})`)
        .join(' · ');

  return (
    <Panel
      title={capabilityInfo.name}
      description={capabilityInfo.description}
      action={<Icon className="size-4 text-gray-11" />}
    >
      <div className="flex items-center gap-4 rounded-xl border border-gray-6 px-3 py-2.5">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {inUse ? (
            <StatusDot tone="success" className="font-medium">
              {sourceName}
            </StatusDot>
          ) : (
            <StatusDot tone="neutral" className="font-medium">
              {t('Not connected')}
            </StatusDot>
          )}
          <TextWithTooltip tooltipMessage={detail}>
            <span className="truncate text-xs text-gray-11">{detail}</span>
          </TextWithTooltip>
        </div>
        {allowWrite && (
          <div className="flex shrink-0 items-center gap-2">
            <AiCapabilityDialog
              capabilityInfo={capabilityInfo}
              existingConfig={config}
              defaultProviderId={chatProviderFallback?.id}
              onSaved={onSaved}
            >
              <Button variant={configured ? 'outline' : 'default'} size="sm">
                {configured ? t('Change') : t('Connect')}
              </Button>
            </AiCapabilityDialog>
            {config && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResetOpen(true)}
              >
                {t('Disconnect')}
              </Button>
            )}
          </div>
        )}
      </div>
      {config && (
        <ConfirmDialog
          open={resetOpen}
          onOpenChange={setResetOpen}
          title={t('Disconnect {name}?', {
            name: capabilityInfo.name.toLowerCase(),
          })}
          description={
            chatProviderFallback
              ? t('Chat goes back to using {provider}.', {
                  provider: chatProviderFallback.name,
                })
              : t(
                  'This removes the saved API key and disables this capability.',
                )
          }
          onConfirm={async () => onDelete()}
          confirmLabel={t('Disconnect')}
        />
      )}
    </Panel>
  );
}

const CAPABILITY_ICON: Record<AiToolCapability, LucideIcon> = {
  [AiToolCapability.WEB_SEARCH]: Search,
  [AiToolCapability.WEB_SCRAPING]: Globe,
  [AiToolCapability.IMAGE_GENERATION]: Image,
};
