import { AIProviderName, tryCatch } from '@activepieces/core-utils';
import {
  AIProviderWithoutSensitiveData,
  PlatformAdminSurface,
  Project,
  UpdateAIProviderRequest,
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

import {
  AdminEmpty,
  adminFeedback,
  AdminFetchErrorState,
  AdminPage,
  AdminPageHeader,
  adminPageResources,
  adminSurface,
  ConfirmDialog,
  SettingsPanel,
  SettingsRow,
  useAdminAction,
} from '@/app/components/admin';
import { PlanFeatureSample } from '@/app/routes/platform/plan-feature-sample';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
import {
  PLATFORM_FEATURES,
  EnterpriseTrialLockedActions,
  usePlanTier,
} from '@/features/billing';
import {
  aiProviderApi,
  aiProviderKeys,
  aiProviderMutations,
  aiProviderQueries,
} from '@/features/platform-admin';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

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
  const configs = (providers ?? []).filter(
    (provider) => provider.provider !== AIProviderName.ACTIVEPIECES,
  );
  const chatProviderRow = (providers ?? []).find(
    (provider) => provider.enabledForChat,
  );

  const { mutate: toggleChatProvider, isPending: isSwitchingChatProvider } =
    useAdminAction<{ providerId: string; displayName: string }>({
      verb: 'update',
      name: t('Chat provider'),
      messages: { failed: t("Couldn't change the chat provider") },
      run: ({ providerId, displayName }) =>
        aiProviderApi.update(providerId, { displayName, enabledForChat: true }),
      onSuccess: () => refetch(),
    });
  const { mutateAsync: deleteProvider } =
    useAdminAction<AIProviderWithoutSensitiveData>({
      verb: 'delete',
      name: (config) => config.name,
      run: (config) => aiProviderApi.delete(config.id),
      onSuccess: () => refetch(),
    });
  const { mutate: recheckProvider, isPending: isRechecking } =
    aiProviderMutations.useRecheckAiProvider({
      onSuccess: ({ status }, providerId) => {
        refetch();
        const name =
          configs.find((config) => config.id === providerId)?.name ?? '';
        adminFeedback.status({
          ok: status === 'active',
          message:
            status === 'active'
              ? t('{name} is working', { name })
              : t('{name}: {status}', {
                  name,
                  status:
                    keyStatusText({ status }) ??
                    t('Could not reach this provider'),
                }),
        });
      },
    });
  const { mutateAsync: updateProvider, isPending: isSaving } = useAdminAction<{
    providerId: string;
    request: UpdateAIProviderRequest;
  }>({
    verb: 'save',
    run: ({ providerId, request }) => aiProviderApi.update(providerId, request),
    feedback: 'inline',
    onSuccess: () => refetch(),
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
    adminFeedback.done({ verb: 'save' });
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
  const available = SUPPORTED_AI_PROVIDERS.filter(
    ({ provider }) => !connectedProviders.includes(provider),
  );

  if (isLoading) {
    return (
      <AdminPage width="content">
        <ProvidersSkeleton />
      </AdminPage>
    );
  }

  const activeConfig = configs.find(
    (config) => config.id === searchParams.get('config'),
  );
  const activeInfo = activeConfig
    ? providerInfoOf({ provider: activeConfig.provider })
    : undefined;
  if (activeConfig && activeInfo && !locked) {
    return (
      <AdminPage width="content">
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
          onDelete={() => deleteProvider(activeConfig)}
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
      </AdminPage>
    );
  }

  const content = (
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

      {isProvidersError ? (
        <AdminFetchErrorState entity={t('AI providers')} onRetry={refetch} />
      ) : configs.length === 0 ? (
        <>
          <AdminEmpty
            icon={<Bot />}
            title={t('Connect your first provider')}
            description={t(
              'Bring an API key, then pick which models and projects can use it. Chat, agents, and AI steps run through it.',
            )}
            action={
              <Button
                onClick={() => openConnect()}
                {...adminControl(AdminControl.AI_PROVIDER_KEY_OPEN)}
              >
                <Plus className="size-4" />
                {t('Connect a provider')}
              </Button>
            }
          />
          <AvailableProviders
            providers={SUPPORTED_AI_PROVIDERS}
            emphasizeRecommended
            onConnect={openConnect}
          />
        </>
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
          {connectedProviders.map((provider) => (
            <ProviderGroup
              key={provider}
              provider={provider}
              configs={configs.filter((config) => config.provider === provider)}
              projects={projects}
              locked={locked}
              onAdd={() => openConnect(provider)}
              onOpen={openConfig}
              onDelete={(config) => deleteProvider(config)}
            />
          ))}
          {!locked && available.length > 0 && (
            <AvailableProviders
              providers={available}
              emphasizeRecommended={false}
              onConnect={openConnect}
            />
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

  return (
    <AdminPage width="content">
      {configs.length === 0 && !isProvidersError ? (
        <PlanFeatureSample feature="aiProviders">
          <div className="flex flex-col gap-6">{content}</div>
        </PlanFeatureSample>
      ) : (
        content
      )}
    </AdminPage>
  );
}

function LockedProvidersAlert() {
  const plan = usePlanTier(PLATFORM_FEATURES.aiProviders.featureKey);

  return (
    <Alert variant="primary">
      <Lock />
      <AlertTitle>
        {t('Your plan does not include Bring your own AI keys')}
      </AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <p>
          {plan.label}.{' '}
          {t(
            'You can still delete the keys below. Adding or changing keys needs that plan.',
          )}
        </p>
        <EnterpriseTrialLockedActions
          featureKey={PLATFORM_FEATURES.aiProviders.featureKey}
          surface={PlatformAdminSurface.SAMPLE}
        />
      </AlertDescription>
    </Alert>
  );
}

function ProviderGroup({
  provider,
  configs,
  projects,
  locked,
  onAdd,
  onOpen,
  onDelete,
}: {
  provider: AIProviderName;
  configs: AIProviderWithoutSensitiveData[];
  projects: Project[];
  locked: boolean;
  onAdd: () => void;
  onOpen: (id: string) => void;
  onDelete: (config: AIProviderWithoutSensitiveData) => Promise<unknown>;
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
      {configs.map((config) => (
        <ConfigRow
          key={config.id}
          config={config}
          projects={projects}
          locked={locked}
          onOpen={() => onOpen(config.id)}
          onDelete={() => onDelete(config)}
        />
      ))}
    </SettingsPanel>
  );
}

function ConfigRow({
  config,
  projects,
  locked,
  onOpen,
  onDelete,
}: {
  config: AIProviderWithoutSensitiveData;
  projects: Project[];
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
    <SettingsRow
      className={cn(
        'group relative py-3 transition-colors',
        !locked &&
          'hover:bg-gray-4 has-[[data-key-link]:focus-visible]:ring-2 has-[[data-key-link]:focus-visible]:ring-inset has-[[data-key-link]:focus-visible]:ring-gray-8',
      )}
      title={
        <>
          {locked ? (
            <TextWithTooltip tooltipMessage={config.name}>
              <span className="min-w-0">{config.name}</span>
            </TextWithTooltip>
          ) : (
            <TextWithTooltip tooltipMessage={config.name}>
              <button
                type="button"
                data-key-link
                onClick={onOpen}
                className="min-w-0 text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
              >
                {config.name}
              </button>
            </TextWithTooltip>
          )}
          {config.enabledForChat && (
            <span className="shrink-0 rounded-md bg-accent-3 px-2 py-px text-xs font-medium text-accent-11">
              {t('Chat')}
            </span>
          )}
          <KeyStatusBadge status={config.status} className="shrink-0" />
        </>
      }
      description={
        <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                tabIndex={config.modelIds.length > 0 ? 0 : undefined}
                className="relative z-10 min-w-0 truncate rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-8"
              >
                {modelsLabel}
                <span aria-hidden> · </span>
                {projectsLabel}
              </span>
            </TooltipTrigger>
            {config.modelIds.length > 0 && (
              <TooltipContent className="max-w-64">
                {config.modelIds.join(', ')}
              </TooltipContent>
            )}
          </Tooltip>
          {config.projectScope !== 'all' && (
            <span className="relative z-10 min-w-0">
              <ProjectChips
                projects={namedProjects}
                excluded={config.projectScope === 'except'}
                allowedCount={allowedProjectCount}
              />
            </span>
          )}
        </span>
      }
    >
      <div className="relative z-10 flex shrink-0 items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                'text-gray-11 transition-opacity hover:bg-danger-3 hover:text-danger-11',
                !locked &&
                  '[@media(hover:hover)]:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100',
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
          <ChevronRight
            aria-hidden
            className="pointer-events-none size-4 text-gray-11 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-gray-12"
          />
        )}
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={t('Delete {name}?', { name: config.name })}
          description={t('Flows and agents that use this key will fail.')}
          confirmLabel={t('Delete key')}
          controlId={AdminControl.AI_PROVIDER_KEY_DELETE_CONFIRM}
          onConfirm={onDelete}
        />
      </div>
    </SettingsRow>
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
    <SettingsPanel flush>
      <SettingsRow
        icon={<MessageSquare />}
        title={t('Chat provider')}
        description={t(
          'Powers the built-in chat for everyone on this platform',
        )}
      >
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
              const info = providerInfoOf({ provider: config.provider });
              return (
                <SelectItem key={config.id} value={config.id}>
                  <div className="flex items-center gap-2">
                    {info && <ProviderLogo info={info} size="sm" />}
                    <span className="truncate">{config.name}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </SettingsRow>
    </SettingsPanel>
  );
}

function AvailableProviders({
  providers,
  emphasizeRecommended,
  onConnect,
}: {
  providers: AiProviderInfo[];
  emphasizeRecommended: boolean;
  onConnect: (provider?: AIProviderName) => void;
}) {
  const ordered = [
    ...RECOMMENDED_PROVIDERS.flatMap((provider) =>
      providers.filter((info) => info.provider === provider),
    ),
    ...providers.filter(
      ({ provider }) => !RECOMMENDED_PROVIDERS.includes(provider),
    ),
  ];

  return (
    <SettingsPanel
      flush
      aria-label={t('Add a provider')}
      title={t('Add a provider')}
      meta={
        <span className="text-sm tabular-nums text-gray-11">
          {providers.length}
        </span>
      }
      description={t('Bring your own API key to connect any of these.')}
    >
      {ordered.map((info) => {
        const recommended =
          emphasizeRecommended && RECOMMENDED_PROVIDERS.includes(info.provider);
        return (
          <SettingsRow
            key={info.provider}
            className="py-3"
            media={<ProviderLogo info={info} size="row" />}
            title={
              <>
                <span className="truncate">{info.name}</span>
                {recommended && (
                  <Badge variant="secondary">{t('Recommended')}</Badge>
                )}
              </>
            }
            description={
              recommended
                ? recommendedTagline({ provider: info.provider })
                : undefined
            }
          >
            <Button
              size="sm"
              variant={recommended ? 'default' : 'outline'}
              onClick={() => onConnect(info.provider)}
              {...adminControl(AdminControl.AI_PROVIDER_OPEN)}
            >
              {t('Connect')}
            </Button>
          </SettingsRow>
        );
      })}
    </SettingsPanel>
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
