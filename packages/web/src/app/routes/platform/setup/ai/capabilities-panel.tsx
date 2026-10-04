import { AIProviderName, isNil } from '@activepieces/core-utils';
import {
  AiProviderToolConfig,
  AIProviderWithoutSensitiveData,
  AiToolCapability,
  AiToolConfigWithoutSensitiveData,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Globe, Image, LucideIcon, Search, Unplug } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { RowMenu } from '@/components/custom/list/row-menu';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { StatusDot } from '@/components/custom/status-dot';
import { Button } from '@/components/ui/button';
import {
  aiToolConfigMutations,
  aiToolConfigQueries,
} from '@/features/platform-admin';

import { AiCapabilityDialog } from '../ai-capabilities/ai-capability-dialog';
import {
  AI_TOOL_CATALOG,
  aiCapabilitySources,
  AiToolCapabilityInfo,
} from '../ai-capabilities/catalog';

export function CapabilitiesPanel({
  providers,
  allowWrite,
}: {
  providers: AIProviderWithoutSensitiveData[];
  allowWrite: boolean;
}) {
  const {
    data: configs,
    isError,
    refetch,
  } = aiToolConfigQueries.useAiToolConfigs();
  const chatProvider =
    providers.find((provider) => provider.enabledForChat) ??
    providers.find(
      (provider) => provider.provider === AIProviderName.ACTIVEPIECES,
    );
  const { mutate: remove } = aiToolConfigMutations.useDeleteAiToolConfig({
    onSuccess: () => refetch(),
  });

  return (
    <Panel
      flush
      title={t('Assistant capabilities')}
      description={t(
        'What the assistant can do beyond the model itself. Keys are stored once, here.',
      )}
    >
      {isError ? (
        <DataFetchErrorState
          entity={t('assistant capabilities')}
          onRetry={refetch}
        />
      ) : (
        <SettingRows>
          {AI_TOOL_CATALOG.map((capabilityInfo) => {
            const config = configs?.find(
              (c) => c.capability === capabilityInfo.capability,
            );
            return (
              <CapabilityRow
                key={capabilityInfo.capability}
                capabilityInfo={capabilityInfo}
                config={config}
                providers={providers}
                chatProviderFallback={
                  chatProvider &&
                  aiCapabilitySources.servesByDefault({
                    capability: capabilityInfo.capability,
                    provider: chatProvider,
                  })
                    ? chatProvider
                    : undefined
                }
                allowWrite={allowWrite}
                onDelete={() => config && remove(config.id)}
                onSaved={() => refetch()}
              />
            );
          })}
        </SettingRows>
      )}
    </Panel>
  );
}

function CapabilityRow({
  capabilityInfo,
  config,
  providers,
  chatProviderFallback,
  allowWrite,
  onDelete,
  onSaved,
}: {
  capabilityInfo: AiToolCapabilityInfo;
  config?: AiToolConfigWithoutSensitiveData;
  providers: AIProviderWithoutSensitiveData[];
  chatProviderFallback?: AIProviderWithoutSensitiveData;
  allowWrite: boolean;
  onDelete: () => void;
  onSaved: () => void;
}) {
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const Icon = CAPABILITY_ICON[capabilityInfo.capability];
  const connectedProvider = capabilityInfo.providers.find(
    (provider) => provider.id === config?.provider,
  );
  const providerChoice = AiProviderToolConfig.safeParse(config?.config);
  const chosenProvider = providerChoice.success
    ? providers.find((p) => p.id === providerChoice.data.aiProviderId)
    : undefined;
  const configured = config?.enabled === true;
  const sourceName = configured
    ? chosenProvider?.name ?? connectedProvider?.name
    : chatProviderFallback?.name;
  const chosenModelId =
    configured && providerChoice.success
      ? providerChoice.data.modelId
      : undefined;
  const status = isNil(sourceName) ? (
    <StatusDot tone="neutral">{t('Not connected')}</StatusDot>
  ) : (
    <StatusDot tone="success">
      {[
        configured
          ? sourceName
          : t('{provider}, through the chat provider', {
              provider: sourceName,
            }),
        chosenModelId,
      ]
        .filter(Boolean)
        .join(' · ')}
    </StatusDot>
  );

  return (
    <SettingRow
      icon={<Icon />}
      title={capabilityInfo.name}
      description={
        <span className="flex flex-col gap-1">
          <span>{capabilityInfo.description}</span>
          {status}
        </span>
      }
      className="items-start"
    >
      {allowWrite && (
        <div className="flex items-center gap-1">
          <AiCapabilityDialog
            capabilityInfo={capabilityInfo}
            existingConfig={config}
            defaultProviderId={chatProviderFallback?.id}
            onSaved={onSaved}
          >
            <Button variant="outline" size="sm">
              {configured ? t('Change') : t('Connect')}
            </Button>
          </AiCapabilityDialog>
          {config && (
            <RowMenu
              items={[
                {
                  label: t('Disconnect'),
                  icon: Unplug,
                  destructive: true,
                  onSelect: () => setDisconnectOpen(true),
                },
              ]}
            />
          )}
        </div>
      )}
      {config && (
        <ConfirmDialog
          open={disconnectOpen}
          onOpenChange={setDisconnectOpen}
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
    </SettingRow>
  );
}

const CAPABILITY_ICON: Record<AiToolCapability, LucideIcon> = {
  [AiToolCapability.WEB_SEARCH]: Search,
  [AiToolCapability.WEB_SCRAPING]: Globe,
  [AiToolCapability.IMAGE_GENERATION]: Image,
};
