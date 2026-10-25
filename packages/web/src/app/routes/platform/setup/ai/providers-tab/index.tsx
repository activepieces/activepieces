import { AIProviderName, tryCatch } from '@activepieces/core-utils';
import {
  AIProviderWithoutSensitiveData,
  PlatformAdminSurface,
  PlatformModelTier,
  Project,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Bot, ChevronRight, Lock, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
  AdminEmpty,
  AdminPageHeader,
  AdminSection,
  SettingsPanel,
  adminPageResources,
  adminSurface,
} from '@/app/components/admin';
import { PlanFeatureSample } from '@/app/routes/platform/plan-feature-sample';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AiProviderInfo, SUPPORTED_AI_PROVIDERS } from '@/features/agents';
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

import { ConfigDetail } from './config-detail';
import { ConnectProviderDialog } from './connect-provider-dialog';
import { DefaultChatModelCard } from './default-chat-model-card';
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
  const hasCredits = (providers ?? []).some(
    (provider) => provider.provider === AIProviderName.ACTIVEPIECES,
  );

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

  const connectedProviders = [...new Set(configs.map((c) => c.provider))];
  const available = SUPPORTED_AI_PROVIDERS.filter(
    ({ provider }) => !connectedProviders.includes(provider),
  );

  if (isLoading) {
    return <ProvidersSkeleton />;
  }

  const activeConfig = configs.find(
    (config) => config.id === searchParams.get('config'),
  );
  const activeInfo = activeConfig
    ? providerInfoOf({ provider: activeConfig.provider })
    : undefined;
  if (activeConfig && activeInfo && !locked) {
    return (
      <>
        <ConfigDetail
          key={`${activeConfig.id}:${credentialsVersion}`}
          config={activeConfig}
          info={activeInfo}
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
      <AdminPageHeader
        title={t('Providers')}
        badge={
          <span className="text-sm tabular-nums text-gray-11">
            {configs.length}
          </span>
        }
        description={
          configs.length === 0
            ? t(
                'Connect a provider to turn on chat, agents, and AI steps across your platform.',
              )
            : t('Each key has its own models and project access.')
        }
        resources={adminPageResources.aiProviders}
      >
        {!locked && (
          <Button
            onClick={() => openConnect()}
            {...adminControl(AdminControl.AI_PROVIDER_KEY_OPEN)}
          >
            <Plus className="size-4" />
            {t('Add key')}
          </Button>
        )}
      </AdminPageHeader>

      {!locked && !isProvidersError && (configs.length > 0 || hasCredits) && (
        <DefaultChatModelCard
          configs={configs}
          tiers={tiers ?? []}
          projectIds={(projects ?? []).map((project) => project.id)}
        />
      )}
      {isProvidersError ? (
        <DataFetchErrorState entity={t('AI providers')} onRetry={refetch} />
      ) : configs.length === 0 ? (
        <EmptyProviders onConnect={openConnect} />
      ) : (
        <>
          {locked && <LockedProvidersAlert />}
          {connectedProviders.map((provider) => (
            <ProviderGroup
              key={provider}
              provider={provider}
              configs={configs.filter((config) => config.provider === provider)}
              projects={projects}
              tiers={tiers ?? []}
              locked={locked}
              onAdd={() => openConnect(provider)}
              onOpen={openConfig}
              onDelete={(id) => deleteProvider(id)}
            />
          ))}
          {!locked && available.length > 0 && (
            <AdminSection
              title={
                <span className="flex items-baseline gap-2">
                  {t('Also available')}
                  <span className="text-sm font-normal tabular-nums text-gray-11">
                    {available.length}
                  </span>
                </span>
              }
              description={t('Bring your own API key to connect any of these.')}
            >
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {available.map((info) => (
                  <AvailableProviderCard
                    key={info.provider}
                    info={info}
                    onConnect={() => openConnect(info.provider)}
                  />
                ))}
              </div>
            </AdminSection>
          )}
        </>
      )}

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
    return (
      <PlanFeatureSample feature="aiProviders">
        <div className="flex flex-col gap-6">{page}</div>
      </PlanFeatureSample>
    );
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

function ProviderGroup({
  provider,
  configs,
  projects,
  tiers,
  locked,
  onAdd,
  onOpen,
  onDelete,
}: {
  provider: AIProviderName;
  configs: AIProviderWithoutSensitiveData[];
  projects: Project[];
  tiers: PlatformModelTier[];
  locked: boolean;
  onAdd: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => Promise<unknown>;
}) {
  const info = providerInfoOf({ provider });
  if (!info) {
    return null;
  }

  return (
    <SettingsPanel
      flush
      title={
        <span className="flex items-center gap-2">
          <ProviderLogo info={info} size="sm" />
          {info.name}
        </span>
      }
      description={t('configurationsCount', { count: configs.length })}
      action={
        locked ? undefined : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAdd}
            {...adminControl(AdminControl.AI_PROVIDER_KEY_OPEN)}
          >
            <Plus className="size-4" />
            {t('Add key')}
          </Button>
        )
      }
    >
      <p className="px-5 py-2 text-xs font-medium text-gray-11">{t('Keys')}</p>
      {configs.map((config) => (
        <ConfigRow
          key={config.id}
          config={config}
          projects={projects}
          tierCount={
            tiers.filter((tier) =>
              tier.entries.some((entry) => entry.configId === config.id),
            ).length
          }
          locked={locked}
          onOpen={() => onOpen(config.id)}
          onDelete={() => onDelete(config.id)}
        />
      ))}
    </SettingsPanel>
  );
}

function ConfigRow({
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
        'group flex items-center gap-4 px-5 py-3 transition-colors',
        !locked &&
          'cursor-pointer hover:bg-gray-4 active:bg-gray-5 focus-visible:bg-gray-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-8',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-medium text-gray-12">
            {config.name}
          </p>
          <KeyStatusBadge status={config.status} />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="w-fit truncate text-xs text-gray-11">
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
        <div className="flex min-w-0 items-center gap-2">
          <ProjectChips
            projects={namedProjects}
            excluded={config.projectScope === 'except'}
            allowedCount={allowedProjectCount}
          />
        </div>
      )}

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
    <>
      <AdminEmpty
        icon={<Bot />}
        title={t('Connect your first provider')}
        description={t(
          'Bring an API key, then pick which models and projects can use it. Chat, agents, and AI steps run through it.',
        )}
        action={
          <Button
            onClick={() => onConnect()}
            {...adminControl(AdminControl.AI_PROVIDER_KEY_OPEN)}
          >
            <Plus className="size-4" />
            {t('Connect a provider')}
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      <AdminSection title={t('Or choose another provider')}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {others.map((info) => (
            <AvailableProviderCard
              key={info.provider}
              info={info}
              onConnect={() => onConnect(info.provider)}
            />
          ))}
        </div>
      </AdminSection>
    </>
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
    <div className={cn(adminSurface.card, 'flex items-center gap-4 p-5')}>
      <ProviderLogo info={info} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm font-medium text-gray-12">{info.name}</p>
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
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <div
        className={cn(adminSurface.card, 'flex items-center gap-4 px-5 py-4')}
      >
        <Skeleton className="size-9 shrink-0 rounded-lg" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-9 w-52 rounded-lg" />
      </div>
      {[0, 1].map((group) => (
        <section
          key={group}
          className={cn(adminSurface.card, 'flex flex-col overflow-hidden')}
        >
          <div className="flex items-center gap-4 border-b p-5">
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
          {[0, 1].map((row) => (
            <div key={row} className="flex flex-col gap-2 px-5 py-4">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-56" />
            </div>
          ))}
        </section>
      ))}
    </>
  );
}

function providerInfoOf({
  provider,
}: {
  provider: AIProviderName;
}): AiProviderInfo | undefined {
  return SUPPORTED_AI_PROVIDERS.find(
    (candidate) => candidate.provider === provider,
  );
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
