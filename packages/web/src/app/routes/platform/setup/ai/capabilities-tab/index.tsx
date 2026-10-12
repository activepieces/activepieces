import { AIProviderName, isNil } from '@activepieces/core-utils';
import {
  AiProviderToolConfig,
  AIProviderWithoutSensitiveData,
  AiToolCapability,
  AiToolConfigWithoutSensitiveData,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Database,
  Globe,
  Image,
  LucideIcon,
  Search,
  Trash2,
} from 'lucide-react';

import {
  AdminPage,
  AdminPageHeader,
  AdminQueryState,
  ConfirmDialog,
  SettingsPanel,
  SettingsRow,
  StatusDot,
  adminPageResources,
  useAdminAction,
} from '@/app/components/admin';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  aiProviderQueries,
  aiToolConfigApi,
  aiToolConfigQueries,
} from '@/features/platform-admin';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { AiCapabilityDialog } from '../../ai-capabilities/ai-capability-dialog';
import {
  AI_TOOL_CATALOG,
  aiCapabilitySources,
  AiToolCapabilityInfo,
} from '../../ai-capabilities/catalog';

export function CapabilitiesTab() {
  const {
    data: configs,
    isLoading: configsLoading,
    isError: configsFailed,
    refetch: refetchConfigs,
  } = aiToolConfigQueries.useAiToolConfigs();
  const {
    data: providers,
    isLoading: providersLoading,
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

  const { mutateAsync: reset } = useAdminAction<{ id: string; name: string }>({
    verb: 'reset',
    name: ({ name }) => name,
    run: ({ id }) => aiToolConfigApi.delete(id),
    onSuccess: () => refetchConfigs(),
  });

  return (
    <AdminPage width="content">
      <AdminPageHeader
        title={t('Assistant capabilities')}
        badge={
          <span className="text-sm tabular-nums text-gray-11">
            {AI_TOOL_CATALOG.length}
          </span>
        }
        description={t(
          'Search and images use your AI provider. Scraping needs a service of its own. Connect a service to use it in place of your provider.',
        )}
        resources={adminPageResources.aiCapabilities}
      />
      <AdminQueryState
        isLoading={configsLoading || providersLoading}
        isError={isError}
        hasData={configs !== undefined && providers !== undefined}
        onRetry={refetch}
        entity={t('AI tools')}
        skeleton={
          <SettingsPanel flush>
            {AI_TOOL_CATALOG.map((capabilityInfo) => (
              <div
                key={capabilityInfo.capability}
                className="flex items-center gap-4 px-5 py-4"
              >
                <Skeleton className="size-9 shrink-0 rounded-lg" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3.5 w-72" />
                </div>
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            ))}
          </SettingsPanel>
        }
      >
        <SettingsPanel flush>
          {AI_TOOL_CATALOG.map((capabilityInfo) => {
            const config = configs?.find(
              (c) => c.capability === capabilityInfo.capability,
            );
            return (
              <CapabilityRow
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
                onDelete={async () => {
                  if (config) {
                    await reset({ id: config.id, name: capabilityInfo.name });
                  }
                }}
                onSaved={() => refetchConfigs()}
              />
            );
          })}
        </SettingsPanel>
      </AdminQueryState>
    </AdminPage>
  );
}

function CapabilityRow({
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
  onDelete: () => Promise<void>;
  onSaved: () => void;
}) {
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
  const status = inUse
    ? t('Using {provider}', { provider: sourceName })
    : t('Not connected');
  const statusText = isNil(chosenModelId)
    ? status
    : `${status} · ${chosenModelId}`;

  return (
    <SettingsRow
      className="group"
      icon={<Icon />}
      title={
        <>
          <span className="truncate">{capabilityInfo.name}</span>
          <StatusDot
            tone={inUse ? 'success' : 'neutral'}
            className="min-w-0 text-xs font-normal text-gray-11"
          >
            <TextWithTooltip tooltipMessage={statusText}>
              <span className="truncate">{statusText}</span>
            </TextWithTooltip>
          </StatusDot>
        </>
      }
      description={capabilityInfo.description}
    >
      {config && (
        <ConfirmDialog
          title={t('Reset {name}?', { name: capabilityInfo.name })}
          description={
            chatProviderFallback
              ? t('Chat goes back to using {provider}.', {
                  provider: chatProviderFallback.name,
                })
              : t(
                  'This removes the saved API key and disables this capability.',
                )
          }
          confirmLabel={t('Reset')}
          controlId={AdminControl.AI_CAPABILITY_RESET_CONFIRM}
          onConfirm={onDelete}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('Reset {name}', { name: capabilityInfo.name })}
            className="text-gray-11 opacity-0 transition-opacity hover:text-danger-11 focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100"
            {...adminControl(AdminControl.AI_CAPABILITY_RESET_OPEN)}
          >
            <Trash2 className="size-4" />
          </Button>
        </ConfirmDialog>
      )}
      <AiCapabilityDialog
        capabilityInfo={capabilityInfo}
        existingConfig={config}
        defaultProviderId={chatProviderFallback?.id}
        onSaved={onSaved}
      >
        <Button
          variant="outline"
          size="sm"
          {...adminControl(AdminControl.AI_CAPABILITY_OPEN)}
        >
          {inUse ? t('Change') : t('Connect')}
        </Button>
      </AiCapabilityDialog>
    </SettingsRow>
  );
}

const CAPABILITY_ICON: Record<AiToolCapability, LucideIcon> = {
  [AiToolCapability.WEB_SEARCH]: Search,
  [AiToolCapability.WEB_SCRAPING]: Globe,
  [AiToolCapability.IMAGE_GENERATION]: Image,
  [AiToolCapability.EMBEDDINGS]: Database,
};
