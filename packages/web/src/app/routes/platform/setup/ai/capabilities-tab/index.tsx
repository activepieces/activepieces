import { AIProviderName, isNil } from '@activepieces/core-utils';
import {
  AiProviderToolConfig,
  AIProviderWithoutSensitiveData,
  AiToolCapability,
  AiToolConfigWithoutSensitiveData,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Globe, Image, LucideIcon, Search, Trash2 } from 'lucide-react';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  aiProviderQueries,
  aiToolConfigMutations,
  aiToolConfigQueries,
} from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

import { AiCapabilityDialog } from '../../ai-capabilities/ai-capability-dialog';
import {
  AI_TOOL_CATALOG,
  aiCapabilitySources,
  AiToolCapabilityInfo,
} from '../../ai-capabilities/catalog';
import { SectionHeader } from '../components/section-header';

export function CapabilitiesTab() {
  const {
    data: configs,
    isError: configsFailed,
    refetch: refetchConfigs,
  } = aiToolConfigQueries.useAiToolConfigs();
  const { platform } = platformHooks.useCurrentPlatform();
  const allowWrite = platform.plan.aiProvidersEnabled;
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
    <div className="flex flex-col gap-4">
      <SectionHeader
        title={t('Assistant capabilities')}
        isPageTitle
        count={AI_TOOL_CATALOG.length}
        description={t(
          'Search and images use your AI provider. Scraping needs a service of its own. Connect a service to use it in place of your provider.',
        )}
      />
      {isError ? (
        <DataFetchErrorState entity={t('AI tools')} onRetry={refetch} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {AI_TOOL_CATALOG.map((capabilityInfo) => {
            const config = configs?.find(
              (c) => c.capability === capabilityInfo.capability,
            );
            return (
              <CapabilityCard
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
                allowWrite={allowWrite}
                onDelete={() => config && remove(config.id)}
                onSaved={() => refetchConfigs()}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function CapabilityCard({
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
    <div className="group flex flex-col rounded-lg border bg-panel">
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-gray-1">
          <Icon className="size-4 text-gray-11" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="truncate text-sm font-medium leading-none">
            {capabilityInfo.name}
          </p>
          <span className="flex min-w-0 items-center gap-1.5 text-xs text-gray-11">
            <span
              className={cn('size-1.5 shrink-0 rounded-full', {
                'bg-success-11': inUse,
                'border border-gray-8': !inUse,
              })}
            />
            <TextWithTooltip tooltipMessage={statusText}>
              <span className="truncate">{statusText}</span>
            </TextWithTooltip>
          </span>
        </div>
        {config && allowWrite && (
          <ConfirmationDeleteDialog
            title={t('Reset {name}', { name: capabilityInfo.name })}
            message={
              chatProviderFallback
                ? t('Chat goes back to using {provider}.', {
                    provider: chatProviderFallback.name,
                  })
                : t(
                    'This removes the saved API key and disables this capability.',
                  )
            }
            entityName={capabilityInfo.name}
            mutationFn={async () => onDelete()}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-gray-11 opacity-0 transition-opacity hover:text-danger-11 group-focus-within:opacity-100 group-hover:opacity-100"
            >
              <Trash2 className="size-4" />
            </Button>
          </ConfirmationDeleteDialog>
        )}
      </div>
      <p className="px-4 pb-4 text-sm text-gray-11">
        {capabilityInfo.description}
      </p>
      <div className="mt-auto flex items-center justify-between gap-4 border-t px-4 py-2.5">
        <span className="text-xs text-gray-11">
          {inUse
            ? t('Available to the assistant')
            : t("The assistant can't do this yet")}
        </span>
        {allowWrite && (
          <AiCapabilityDialog
            capabilityInfo={capabilityInfo}
            existingConfig={config}
            defaultProviderId={chatProviderFallback?.id}
            onSaved={onSaved}
          >
            <Button variant="outline" size="sm">
              {inUse ? t('Change') : t('Connect')}
            </Button>
          </AiCapabilityDialog>
        )}
      </div>
    </div>
  );
}

const CAPABILITY_ICON: Record<AiToolCapability, LucideIcon> = {
  [AiToolCapability.WEB_SEARCH]: Search,
  [AiToolCapability.WEB_SCRAPING]: Globe,
  [AiToolCapability.IMAGE_GENERATION]: Image,
};
