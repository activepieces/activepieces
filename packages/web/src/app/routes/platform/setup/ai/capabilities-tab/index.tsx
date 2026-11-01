import { AIProviderName, isNil } from '@activepieces/core-utils';
import {
  AiProviderToolConfig,
  AIProviderWithoutSensitiveData,
  AiToolCapability,
  AiToolConfigWithoutSensitiveData,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  ArrowRight,
  Database,
  Globe,
  Image,
  LucideIcon,
  Search,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import {
  AdminPageHeader,
  AdminSection,
  adminPageResources,
  adminSurface,
} from '@/app/components/admin';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { LogoPlate } from '@/components/custom/logo-plate';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  aiProviderQueries,
  aiToolConfigMutations,
  aiToolConfigQueries,
} from '@/features/platform-admin';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { AiCapabilityDialog } from '../../ai-capabilities/ai-capability-dialog';
import {
  AI_TOOL_CATALOG,
  aiCapabilitySources,
  AiToolCapabilityInfo,
  AiToolProviderInfo,
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
  const creditsProvider = providers?.find(
    (provider) => provider.provider === AIProviderName.ACTIVEPIECES,
  );
  const chatProvider =
    providers?.find((provider) => provider.enabledForChat) ?? creditsProvider;

  const { mutateAsync: remove } = aiToolConfigMutations.useDeleteAiToolConfig({
    onSuccess: () => refetchConfigs(),
    onError: (error) => {
      const data = error.response?.data;
      toast.error(
        t(
          data?.params?.message ??
            data?.message ??
            'Could not reset this capability',
        ),
      );
    },
  });

  return (
    <>
      <AdminPageHeader
        title={t('Capabilities')}
        description={t('Extra skills for chat, agents and knowledge bases.')}
        resources={adminPageResources.aiCapabilities}
      />
      {isError ? (
        <DataFetchErrorState entity={t('AI tools')} onRetry={refetch} />
      ) : (
        capabilityGroups().map((group) => (
          <AdminSection key={group.title} title={group.title}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {AI_TOOL_CATALOG.filter((info) =>
                group.capabilities.includes(info.capability),
              ).map((capabilityInfo) => (
                <CapabilityCard
                  key={capabilityInfo.capability}
                  capabilityInfo={capabilityInfo}
                  config={configs?.find(
                    (c) => c.capability === capabilityInfo.capability,
                  )}
                  providers={providers ?? []}
                  chatProviderFallback={fallbackFor({
                    capability: capabilityInfo.capability,
                    candidates:
                      capabilityInfo.capability === AiToolCapability.EMBEDDINGS
                        ? [chatProvider, creditsProvider]
                        : [chatProvider],
                  })}
                  onDelete={(id) => remove(id)}
                  onSaved={() => refetchConfigs()}
                />
              ))}
            </div>
          </AdminSection>
        ))
      )}
    </>
  );
}

function fallbackFor({
  capability,
  candidates,
}: {
  capability: AiToolCapability;
  candidates: (AIProviderWithoutSensitiveData | undefined)[];
}): AIProviderWithoutSensitiveData | undefined {
  return candidates.find(
    (candidate): candidate is AIProviderWithoutSensitiveData =>
      candidate !== undefined &&
      aiCapabilitySources.servesByDefault({ capability, provider: candidate }),
  );
}

function CapabilityCard({
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
  onDelete: (id: string) => Promise<unknown>;
  onSaved: () => void;
}) {
  const look = CAPABILITY_LOOK[capabilityInfo.capability];
  const isEmbeddings =
    capabilityInfo.capability === AiToolCapability.EMBEDDINGS;
  const needsProviderKey =
    isEmbeddings &&
    aiCapabilitySources.eligibleProviders({
      capability: capabilityInfo.capability,
      providers,
    }).length === 0;
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
  const servedByAiKeys =
    capabilityInfo.capability !== AiToolCapability.WEB_SCRAPING;

  return (
    <div className={cn(adminSurface.card, 'group flex flex-col')}>
      <div className="flex items-start gap-3 p-5">
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            look.tile,
          )}
        >
          <look.icon className="size-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-sm font-semibold text-gray-12">
            {capabilityInfo.name}
          </p>
          <p className="text-sm text-gray-11">{capabilityInfo.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {config && (
            <ConfirmationDeleteDialog
              title={t('Reset {name}', { name: capabilityInfo.name })}
              message={
                chatProviderFallback
                  ? isEmbeddings
                    ? t('Knowledge bases go back to using {provider}.', {
                        provider: chatProviderFallback.name,
                      })
                    : t('Chat goes back to using {provider}.', {
                        provider: chatProviderFallback.name,
                      })
                  : t(
                      'This removes the saved API key and disables this capability.',
                    )
              }
              entityName={capabilityInfo.name}
              showToast
              onError={() => undefined}
              controlId={AdminControl.AI_CAPABILITY_RESET_CONFIRM}
              mutationFn={async () => {
                await onDelete(config.id);
              }}
            >
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-gray-11 opacity-0 transition-opacity hover:text-danger-11 group-focus-within:opacity-100 group-hover:opacity-100"
                {...adminControl(AdminControl.AI_CAPABILITY_RESET_OPEN)}
              >
                <Trash2 className="size-4" />
              </Button>
            </ConfirmationDeleteDialog>
          )}
          {needsProviderKey ? (
            <Button asChild variant="outline" size="sm">
              <Link to="/platform/ai">
                {t('Connect a provider')}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
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
                {inUse ? t('Change') : t('Set up')}
              </Button>
            </AiCapabilityDialog>
          )}
        </div>
      </div>
      <div className="mt-auto flex min-h-11 min-w-0 items-center gap-2 border-t px-5 py-2.5 text-xs text-gray-11">
        {inUse ? (
          <CapabilityInUse sourceName={sourceName} modelId={chosenModelId} />
        ) : (
          <CapabilityOptions
            providers={capabilityInfo.providers}
            servedByAiKeys={servedByAiKeys}
          />
        )}
      </div>
    </div>
  );
}

function CapabilityInUse({
  sourceName,
  modelId,
}: {
  sourceName: string | undefined;
  modelId: string | undefined;
}) {
  const label = t('Using {provider}', { provider: sourceName });
  return (
    <>
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full bg-success-10"
      />
      <TextWithTooltip tooltipMessage={label}>
        <span className="truncate font-medium text-gray-12">{label}</span>
      </TextWithTooltip>
      {modelId && (
        <>
          <span aria-hidden>·</span>
          <TextWithTooltip tooltipMessage={modelId}>
            <span className="truncate">{modelId}</span>
          </TextWithTooltip>
        </>
      )}
    </>
  );
}

function CapabilityOptions({
  providers,
  servedByAiKeys,
}: {
  providers: AiToolProviderInfo[];
  servedByAiKeys: boolean;
}) {
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <span>{t('Works with')}</span>
      {providers.map((provider, index) => (
        <span key={provider.id} className="inline-flex items-center gap-1.5">
          {index > 0 && <span>{t('or')}</span>}
          <LogoPlate
            src={provider.logoUrl}
            alt={provider.name}
            border
            className="size-5 rounded-md"
            innerClassName="p-0.5"
          />
          <span className="text-gray-12">
            {t('{service} API key', { service: provider.name })}
          </span>
        </span>
      ))}
      {servedByAiKeys && (
        <span className="text-gray-12">
          {providers.length > 0
            ? t('or an AI provider key')
            : t('an AI provider key')}
        </span>
      )}
    </span>
  );
}

function capabilityGroups(): {
  title: string;
  capabilities: AiToolCapability[];
}[] {
  return [
    {
      title: t('Chat and agents'),
      capabilities: [
        AiToolCapability.WEB_SEARCH,
        AiToolCapability.WEB_SCRAPING,
        AiToolCapability.IMAGE_GENERATION,
      ],
    },
    {
      title: t('Knowledge bases'),
      capabilities: [AiToolCapability.EMBEDDINGS],
    },
  ];
}

const CAPABILITY_LOOK: Record<
  AiToolCapability,
  { icon: LucideIcon; tile: string }
> = {
  [AiToolCapability.WEB_SEARCH]: {
    icon: Search,
    tile: 'bg-swatch-11-surface text-swatch-11-ink',
  },
  [AiToolCapability.WEB_SCRAPING]: {
    icon: Globe,
    tile: 'bg-swatch-8-surface text-swatch-8-ink',
  },
  [AiToolCapability.IMAGE_GENERATION]: {
    icon: Image,
    tile: 'bg-swatch-4-surface text-swatch-4-ink',
  },
  [AiToolCapability.EMBEDDINGS]: {
    icon: Database,
    tile: 'bg-swatch-5-surface text-swatch-5-ink',
  },
};
