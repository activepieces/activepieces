import { AIProviderName, tryCatch } from '@activepieces/core-utils';
import {
  AIProviderWithoutSensitiveData,
  PlatformAdminSurface,
  PlatformModelTier,
  Project,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  Bot,
  ChevronRight,
  Lock,
  MessageSquare,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { PlanFeatureSample } from '@/app/routes/platform/plan-feature-sample';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AiProviderInfo, SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import { modelMeta } from '@/features/agents/ai-model/model-meta';
import {
  PLATFORM_FEATURES,
  TIER_LABELS,
  useUpgradeClick,
} from '@/features/billing';
import {
  aiProviderKeys,
  aiProviderMutations,
  aiProviderQueries,
} from '@/features/platform-admin';
import { platformModelTierQueries } from '@/features/platform-admin/hooks/platform-model-tier-hooks';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { SectionHeader } from '../components/section-header';

import { ConfigDetail } from './config-detail';
import { ConnectProviderDialog } from './connect-provider-dialog';
import { KeyStatusBadge, keyStatusText } from './key-status';
import { ProjectSwatch } from './project-selection-panel';
import { ProviderLogo } from './provider-logo';

export function ProvidersTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<
    AIProviderWithoutSensitiveData | undefined
  >(undefined);
  const [credentialsVersion, setCredentialsVersion] = useState(0);
  const [dialogProvider, setDialogProvider] = useState<
    AIProviderName | undefined
  >(undefined);

  const queryClient = useQueryClient();
  const { platform } = platformHooks.useCurrentPlatform();
  const locked = !platform.plan.aiProvidersEnabled;
  const {
    data: providers,
    isLoading,
    isError: isProvidersError,
    refetch,
  } = aiProviderQueries.useAiProviderConfigs();
  const { data: projects } = projectCollectionUtils.useAllPlatformProjects();
  const { data: tiers } = platformModelTierQueries.useAdminList();
  const configs = (providers ?? []).filter(
    (provider) => provider.provider !== AIProviderName.ACTIVEPIECES,
  );
  const chatProviderRow = (providers ?? []).find(
    (provider) => provider.enabledForChat,
  );

  const { mutate: toggleChatProvider, isPending: isSwitchingChatProvider } =
    aiProviderMutations.useToggleChatProvider({
      onSuccess: () => {
        refetch();
        toast.success(t('Chat provider updated'));
      },
    });
  const { mutateAsync: deleteProvider } =
    aiProviderMutations.useDeleteAiProvider({
      onSuccess: () => refetch(),
      onError: (error) => {
        const data = error.response?.data;
        toast.error(
          t(
            data?.params?.message ??
              data?.message ??
              'Could not delete this key',
          ),
        );
      },
    });
  const { mutate: recheckProvider, isPending: isRechecking } =
    aiProviderMutations.useRecheckAiProvider({
      onSuccess: ({ status }) => {
        refetch();
        const label = keyStatusText({ status });
        if (status === 'active') {
          toast.success(label ?? t('Saved'));
          return;
        }
        toast.error(label ?? t('Could not reach this provider'));
      },
    });
  const { mutateAsync: updateProvider, isPending: isSaving } =
    aiProviderMutations.useUpdateAiProvider({
      onSuccess: () => {
        refetch();
        toast.success(t('Saved'));
      },
      onError: (error) => {
        const data = error.response?.data;
        toast.error(
          t(
            data?.params?.message ?? data?.message ?? 'Could not save this key',
          ),
        );
      },
    });

  const openConfig = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('config', id);
    setSearchParams(next);
  };
  const closeConfig = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('config');
    setSearchParams(next);
  };
  const openConnect = (provider?: AIProviderName) => {
    setEditing(undefined);
    setDialogProvider(provider);
    setDialogOpen(true);
  };
  const openReplaceCredentials = (config: AIProviderWithoutSensitiveData) => {
    setEditing(config);
    setDialogProvider(undefined);
    setDialogOpen(true);
  };
  const onConnected = async (createdId?: string) => {
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({
        queryKey: aiProviderKeys.configModels(),
      }),
    ]);
    toast.success(t('Saved'));
    if (createdId) {
      openConfig(createdId);
      return;
    }
    setCredentialsVersion((version) => version + 1);
  };
  const selectChatConfig = (configId: string) => {
    const row = (providers ?? []).find((config) => config.id === configId);
    if (row) {
      toggleChatProvider({ providerId: row.id, displayName: row.name });
    }
  };

  const connectedProviders = [...new Set(configs.map((c) => c.provider))];
  const sortedConfigs = [...configs].sort(compareKeys);
  const available = SUPPORTED_AI_PROVIDERS.filter(
    ({ provider }) => !connectedProviders.includes(provider),
  );

  if (isLoading) {
    return <ProvidersSkeleton />;
  }

  const activeConfig = configs.find(
    (config) => config.id === searchParams.get('config'),
  );
  if (activeConfig && !locked) {
    return (
      <>
        <ConfigDetail
          key={`${activeConfig.id}:${credentialsVersion}`}
          config={activeConfig}
          info={modelMeta.providerInfoOf({ provider: activeConfig.provider })}
          projects={projects}
          isSaving={isSaving}
          onSave={(request) =>
            tryCatch(() =>
              updateProvider({ providerId: activeConfig.id, request }),
            )
          }
          onDelete={() => deleteProvider(activeConfig.id)}
          onReplaceCredentials={() => openReplaceCredentials(activeConfig)}
          isRechecking={isRechecking}
          onRecheck={() => recheckProvider(activeConfig.id)}
          onBack={closeConfig}
        />
        <ConnectProviderDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editing={editing}
          defaultProvider={dialogProvider}
          onConnected={onConnected}
        />
      </>
    );
  }

  const page = (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-3">
          <SectionHeader
            title={t('Providers')}
            isPageTitle
            count={configs.length}
            description={
              configs.length === 0
                ? t(
                    'Connect a provider to turn on chat, agents, and AI steps across your platform.',
                  )
                : t('Each key has its own models and project access.')
            }
          />
          {!locked && (
            <Button
              size="sm"
              className="shrink-0"
              onClick={() => openConnect()}
              {...adminControl(AdminControl.AI_PROVIDER_KEY_OPEN)}
            >
              <Plus className="size-4" />
              {t('Add key')}
            </Button>
          )}
        </div>

        {isProvidersError ? (
          <DataFetchErrorState entity={t('AI providers')} onRetry={refetch} />
        ) : configs.length === 0 ? (
          <EmptyProviders onConnect={openConnect} />
        ) : (
          <>
            {locked && <LockedProvidersAlert />}
            {!locked && (
              <ChatProviderRow
                configs={providers ?? []}
                value={chatProviderRow?.id ?? null}
                isSwitching={isSwitchingChatProvider}
                onChange={selectChatConfig}
              />
            )}
            <div
              className={cn(
                'overflow-hidden rounded-xl border border-gray-6/60 bg-panel',
                CARD_SHADOW,
              )}
            >
              {sortedConfigs.map((config) => (
                <KeyRow
                  key={config.id}
                  config={config}
                  projects={projects}
                  tierCount={tierCountOf({ tiers: tiers ?? [], config })}
                  locked={locked}
                  onOpen={() => openConfig(config.id)}
                  onDelete={() => deleteProvider(config.id)}
                />
              ))}
            </div>
            {!locked && available.length > 0 && (
              <section className="flex flex-col gap-4 border-t border-gray-6/60 pt-6">
                <SectionHeader
                  title={t('Also available')}
                  count={available.length}
                  description={t(
                    'Bring your own API key to connect any of these.',
                  )}
                />
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {available.map((info) => (
                    <AvailableProviderCard
                      key={info.provider}
                      info={info}
                      onConnect={() => openConnect(info.provider)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <ConnectProviderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        defaultProvider={dialogProvider}
        onConnected={onConnected}
      />
    </>
  );

  if (configs.length === 0 && !isProvidersError) {
    return <PlanFeatureSample feature="aiProviders">{page}</PlanFeatureSample>;
  }
  return page;
}

function LockedProvidersAlert() {
  const upgradeClick = useUpgradeClick();
  const { featureKey, tier } = PLATFORM_FEATURES.aiProviders;

  return (
    <Alert variant="primary">
      <Lock />
      <AlertTitle>
        {t('Your plan does not include Bring your own AI keys')}
      </AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <p>
          {t(
            'You can still delete the keys below. Upgrade your plan to add new keys or change existing ones.',
          )}
        </p>
        <Button
          size="sm"
          onClick={() =>
            upgradeClick({
              feature: featureKey,
              tier,
              surface: PlatformAdminSurface.SAMPLE,
            })
          }
        >
          {t('Upgrade to {tier}', { tier: TIER_LABELS[tier] })}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

function KeyRow({
  config,
  projects,
  tierCount,
  locked,
  onOpen,
  onDelete,
}: {
  config: AIProviderWithoutSensitiveData;
  projects: Project[];
  tierCount: number;
  locked: boolean;
  onOpen: () => void;
  onDelete: () => Promise<unknown>;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const namedProjects = projects.filter((project) =>
    config.projectIds.includes(project.id),
  );
  const allowedProjectCount =
    config.projectScope === 'except'
      ? projects.length - namedProjects.length
      : namedProjects.length;
  const modelsLabel =
    config.modelScope === 'all'
      ? t('All models')
      : t('modelsCount', { count: config.modelIds.length });
  const projectsLabel =
    config.projectScope === 'all'
      ? t('All projects')
      : config.projectScope === 'except'
      ? t('exceptProjectsCount', { count: namedProjects.length })
      : t('projectsCount', { count: allowedProjectCount });

  const info = modelMeta.providerInfoOf({ provider: config.provider });

  return (
    <div
      role={locked ? undefined : 'button'}
      tabIndex={locked ? undefined : 0}
      onClick={locked ? undefined : onOpen}
      onKeyDown={(event) => {
        if (!locked && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        'group flex items-center gap-4 border-b border-gray-6/60 px-5 py-3.5 transition-colors last:border-b-0',
        !locked &&
          'cursor-pointer hover:bg-gray-2 active:bg-gray-3 focus-visible:bg-gray-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-8',
      )}
    >
      <ProviderLogo info={info} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-medium leading-none">
            {config.name}
          </p>
          {config.enabledForChat && (
            <span className="shrink-0 rounded-full bg-accent-3 px-2 py-px text-xs font-medium text-accent-11">
              {t('Chat')}
            </span>
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="w-fit truncate text-xs text-gray-11">
              {info.name}
              <span aria-hidden> · </span>
              {modelsLabel}
              <span aria-hidden> · </span>
              {projectsLabel}
              {tierCount > 0 && (
                <>
                  <span aria-hidden> · </span>
                  {t('usedByTiersCount', { count: tierCount })}
                </>
              )}
            </p>
          </TooltipTrigger>
          {config.modelIds.length > 0 && (
            <TooltipContent className="max-w-64">
              {config.modelIds.join(', ')}
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      {config.projectScope !== 'all' && (
        <div className="hidden min-w-0 items-center gap-1.5 md:flex">
          <ProjectChips
            projects={namedProjects}
            excluded={config.projectScope === 'except'}
            allowedCount={allowedProjectCount}
          />
        </div>
      )}

      <KeyStatusBadge status={config.status} />

      <div
        className="flex shrink-0 items-center gap-1"
        onClick={(event) => event.stopPropagation()}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                'text-gray-11 opacity-0 transition-opacity hover:bg-danger-3 hover:text-danger-11 focus-visible:opacity-100 group-hover:opacity-100',
                locked && 'opacity-100',
              )}
              onClick={() => setDeleteOpen(true)}
              {...adminControl(AdminControl.AI_PROVIDER_KEY_DELETE_OPEN)}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">{t('Delete')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('Delete')}</TooltipContent>
        </Tooltip>
        {!locked && (
          <ChevronRight className="size-4 text-gray-11 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-gray-12" />
        )}
        <ConfirmationDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={t('Delete {name}', { name: config.name })}
          message={t('Flows and agents that use this key will fail.')}
          entityName={config.name}
          showToast={true}
          onError={() => undefined}
          controlId={AdminControl.AI_PROVIDER_KEY_DELETE_CONFIRM}
          mutationFn={async () => {
            await onDelete();
          }}
        />
      </div>
    </div>
  );
}

function ProjectChips({
  projects,
  excluded,
  allowedCount,
}: {
  projects: Project[];
  excluded: boolean;
  allowedCount: number;
}) {
  const shown = projects.slice(0, 3);
  const rest = projects.length - shown.length;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex min-w-0 items-center gap-1">
          {excluded && (
            <span className="shrink-0 text-sm text-gray-11">
              {t('All except')}
            </span>
          )}
          {shown.map((project) => (
            <ProjectSwatch key={project.id} project={project} />
          ))}
          {rest > 0 && (
            <span className="text-sm text-gray-11 tabular-nums">
              {t('+{count}', { count: rest })}
            </span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        {excluded
          ? t('{count} projects have access. Excluded: {names}', {
              count: allowedCount,
              names: projects.map((project) => project.displayName).join(', '),
            })
          : projects.map((project) => project.displayName).join(', ')}
      </TooltipContent>
    </Tooltip>
  );
}

function ChatProviderRow({
  configs,
  value,
  isSwitching,
  onChange,
}: {
  configs: AIProviderWithoutSensitiveData[];
  value: string | null;
  isSwitching: boolean;
  onChange: (configId: string) => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-gray-6/60 bg-panel px-4 py-3',
        CARD_SHADOW,
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gray-3/60">
        <MessageSquare className="size-4 text-gray-11" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-none">{t('Chat provider')}</p>
        <p className="text-xs text-gray-11 mt-1">
          {t('Powers the built-in chat for everyone on this platform')}
        </p>
      </div>
      <Select
        value={value ?? undefined}
        onValueChange={onChange}
        disabled={isSwitching}
      >
        <SelectTrigger className="w-52">
          <SelectValue placeholder={t('Select provider')} />
        </SelectTrigger>
        <SelectContent>
          {configs.map((config) => {
            const info = modelMeta.providerInfoOf({
              provider: config.provider,
            });
            return (
              <SelectItem key={config.id} value={config.id}>
                <div className="flex items-center gap-2">
                  <ProviderLogo info={info} size="sm" />
                  <span className="truncate">{config.name}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

function EmptyProviders({
  onConnect,
}: {
  onConnect: (provider?: AIProviderName) => void;
}) {
  const recommended = RECOMMENDED_PROVIDERS.map((provider) =>
    SUPPORTED_AI_PROVIDERS.find((info) => info.provider === provider),
  ).filter((info): info is AiProviderInfo => info !== undefined);
  const others = SUPPORTED_AI_PROVIDERS.filter(
    ({ provider }) => !RECOMMENDED_PROVIDERS.includes(provider),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-6/60 bg-panel px-6 py-14 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-accent-3">
          <Bot className="size-5 text-accent-11" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold tracking-tight">
            {t('Connect your first provider')}
          </p>
          <p className="max-w-md text-sm text-gray-11">
            {t(
              'Bring an API key, then pick which models and projects can use it. Chat, agents, and AI steps run through it.',
            )}
          </p>
        </div>
        <Button
          onClick={() => onConnect()}
          {...adminControl(AdminControl.AI_PROVIDER_KEY_OPEN)}
        >
          <Plus className="size-4" />
          {t('Connect a provider')}
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {recommended.map((info) => (
          <AvailableProviderCard
            key={info.provider}
            info={info}
            tagline={recommendedTagline({ provider: info.provider })}
            recommended
            onConnect={() => onConnect(info.provider)}
          />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium text-gray-11">
          {t('Or choose another provider')}
        </p>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {others.map((info) => (
            <AvailableProviderCard
              key={info.provider}
              info={info}
              onConnect={() => onConnect(info.provider)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AvailableProviderCard({
  info,
  tagline,
  recommended,
  onConnect,
}: {
  info: AiProviderInfo;
  tagline?: string;
  recommended?: boolean;
  onConnect: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-gray-6/60 bg-panel p-4 transition-colors hover:border-gray-6',
        CARD_SHADOW,
      )}
    >
      <ProviderLogo info={info} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm font-medium leading-none">{info.name}</p>
        {tagline && <p className="truncate text-xs text-gray-11">{tagline}</p>}
      </div>
      <Button
        size="sm"
        variant={recommended ? 'default' : 'outline'}
        onClick={onConnect}
        {...adminControl(AdminControl.AI_PROVIDER_OPEN)}
      >
        {t('Connect')}
      </Button>
    </div>
  );
}

function ProvidersSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl border border-gray-6/60 bg-panel px-4 py-3',
          CARD_SHADOW,
        )}
      >
        <Skeleton className="size-9 shrink-0 rounded-xl" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-9 w-52 rounded-md" />
      </div>
      <section
        className={cn(
          'overflow-hidden rounded-xl border border-gray-6/60 bg-panel',
          CARD_SHADOW,
        )}
      >
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="flex items-center gap-4 border-b border-gray-6/60 px-5 py-3.5 last:border-b-0"
          >
            <Skeleton className="size-8 shrink-0 rounded-xl" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

const CARD_SHADOW = 'shadow-panel';

function compareKeys(
  a: AIProviderWithoutSensitiveData,
  b: AIProviderWithoutSensitiveData,
): number {
  if (a.enabledForChat !== b.enabledForChat) {
    return a.enabledForChat ? -1 : 1;
  }
  return (
    modelMeta
      .providerInfoOf({ provider: a.provider })
      .name.localeCompare(
        modelMeta.providerInfoOf({ provider: b.provider }).name,
      ) || a.name.localeCompare(b.name)
  );
}

function tierCountOf({
  tiers,
  config,
}: {
  tiers: PlatformModelTier[];
  config: AIProviderWithoutSensitiveData;
}): number {
  return tiers.filter((tier) =>
    tier.entries.some((entry) => entry.configId === config.id),
  ).length;
}

const RECOMMENDED_PROVIDERS: AIProviderName[] = [
  AIProviderName.ANTHROPIC,
  AIProviderName.OPENAI,
];

function recommendedTagline({
  provider,
}: {
  provider: AIProviderName;
}): string | undefined {
  switch (provider) {
    case AIProviderName.ANTHROPIC:
      return t('Claude models — strong for chat and agents');
    case AIProviderName.OPENAI:
      return t('GPT models — broad ecosystem and tooling');
    default:
      return undefined;
  }
}
