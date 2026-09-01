import { AIProviderName } from '@activepieces/core-utils';
import { AIProviderWithoutSensitiveData, Project } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Bot, ChevronRight, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AiProviderInfo, SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import {
  aiProviderKeys,
  aiProviderMutations,
  aiProviderQueries,
} from '@/features/platform-admin';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

import { SectionHeader } from '../components/section-header';

import { ConfigDetail } from './config-detail';
import { ConnectProviderDialog } from './connect-provider-dialog';
import { KeyStatusBadge } from './key-status';
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
  const { data: providers, refetch } = aiProviderQueries.useAiProviderConfigs();
  const { platform } = platformHooks.useCurrentPlatform();
  const allowWrite = platform.plan.aiProvidersEnabled;
  const { data: projects } = projectCollectionUtils.useAllPlatformProjects();
  const configs = (providers ?? []).filter(
    (provider) => provider.provider !== AIProviderName.ACTIVEPIECES,
  );
  const chatProviderRow = (providers ?? []).find(
    (provider) => provider.enabledForChat,
  );

  const { mutate: toggleChatProvider } =
    aiProviderMutations.useToggleChatProvider({
      onSuccess: () => refetch(),
    });
  const { mutateAsync: deleteProvider } =
    aiProviderMutations.useDeleteAiProvider({
      onSuccess: () => refetch(),
    });
  const { mutate: recheckProvider, isPending: isRechecking } =
    aiProviderMutations.useRecheckAiProvider({
      onSuccess: () => refetch(),
    });
  const { mutate: updateProvider, isPending: isSaving } =
    aiProviderMutations.useUpdateAiProvider({
      onSuccess: () => refetch(),
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

  const activeConfig = configs.find(
    (config) => config.id === searchParams.get('config'),
  );
  const activeInfo = activeConfig
    ? providerInfoOf({ provider: activeConfig.provider })
    : undefined;
  if (activeConfig && activeInfo && allowWrite) {
    return (
      <>
        <ConfigDetail
          key={`${activeConfig.id}:${credentialsVersion}`}
          config={activeConfig}
          info={activeInfo}
          projects={projects}
          isSaving={isSaving}
          onSave={(request) =>
            updateProvider({ providerId: activeConfig.id, request })
          }
          onDelete={async () => {
            await deleteProvider(activeConfig.id);
            closeConfig();
          }}
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

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-3">
          <SectionHeader
            title={t('Providers')}
            count={configs.length}
            description={
              configs.length === 0
                ? t(
                    'Connect a provider to turn on chat, agents, and AI steps across your platform.',
                  )
                : t('Each key has its own models and project access.')
            }
          />
          {allowWrite && (
            <Button
              size="sm"
              className="shrink-0"
              onClick={() => openConnect()}
            >
              <Plus className="size-4" />
              {t('Add key')}
            </Button>
          )}
        </div>

        {configs.length === 0 ? (
          <EmptyProviders onConnect={openConnect} allowWrite={allowWrite} />
        ) : (
          <>
            {allowWrite && (
              <ChatProviderRow
                configs={providers ?? []}
                value={chatProviderRow?.id ?? null}
                onChange={selectChatConfig}
              />
            )}
            <div className="flex flex-col gap-6">
              {connectedProviders.map((provider) => (
                <ProviderGroup
                  key={provider}
                  provider={provider}
                  configs={configs.filter(
                    (config) => config.provider === provider,
                  )}
                  projects={projects}
                  allowWrite={allowWrite}
                  onAdd={() => openConnect(provider)}
                  onOpen={openConfig}
                  onDelete={(id) => deleteProvider(id)}
                />
              ))}
            </div>
            {available.length > 0 && (
              <section className="flex flex-col gap-4 border-t border-border/60 pt-6">
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
                      allowWrite={allowWrite}
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
}

function ProviderGroup({
  provider,
  configs,
  projects,
  allowWrite,
  onAdd,
  onOpen,
  onDelete,
}: {
  provider: AIProviderName;
  configs: AIProviderWithoutSensitiveData[];
  projects: Project[];
  allowWrite: boolean;
  onAdd: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => Promise<unknown>;
}) {
  const info = providerInfoOf({ provider });
  if (!info) {
    return null;
  }

  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border border-border/60 bg-card',
        CARD_SHADOW,
      )}
    >
      <div className="flex items-center gap-3 px-5 py-4">
        <ProviderLogo info={info} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-none">{info.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('configurationsCount', { count: configs.length })}
          </p>
        </div>
        {allowWrite && (
          <Button variant="ghost" size="sm" onClick={onAdd}>
            <Plus className="size-4" />
            {t('Add key')}
          </Button>
        )}
      </div>
      <div className="border-t border-border/60 px-5 pb-1 pt-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {t('Keys')}
        </p>
      </div>
      <div>
        {configs.map((config) => (
          <ConfigRow
            key={config.id}
            config={config}
            projects={projects}
            allowWrite={allowWrite}
            onOpen={() => onOpen(config.id)}
            onDelete={() => onDelete(config.id)}
          />
        ))}
      </div>
    </section>
  );
}

function ConfigRow({
  config,
  projects,
  allowWrite,
  onOpen,
  onDelete,
}: {
  config: AIProviderWithoutSensitiveData;
  projects: Project[];
  allowWrite: boolean;
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
      role={allowWrite ? 'button' : undefined}
      tabIndex={allowWrite ? 0 : undefined}
      onClick={allowWrite ? onOpen : undefined}
      onKeyDown={(event) => {
        if (allowWrite && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        'group flex items-center gap-4 px-5 py-3 transition-colors',
        allowWrite &&
          'cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium leading-none">
            {config.name}
          </p>
          {config.enabledForChat && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-px text-[11px] font-medium text-primary">
              {t('Chat')}
            </span>
          )}
          <KeyStatusBadge status={config.status} />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="w-fit truncate text-xs text-muted-foreground">
              {modelsLabel}
              <span aria-hidden> · </span>
              {projectsLabel}
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
        <div className="flex min-w-0 items-center gap-1.5">
          <ProjectChips
            projects={namedProjects}
            excluded={config.projectScope === 'except'}
            allowedCount={allowedProjectCount}
          />
        </div>
      )}

      {allowWrite && (
        <div
          className="flex shrink-0 items-center gap-1"
          onClick={(event) => event.stopPropagation()}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="px-2 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
                <span className="sr-only">{t('Delete')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('Delete')}</TooltipContent>
          </Tooltip>
          <ChevronRight className="size-4 text-muted-foreground" />
          <ConfirmationDeleteDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title={t('Delete {name}', { name: config.name })}
            message={t('Steps and agents using this key will stop working.')}
            entityName={config.name}
            mutationFn={async () => {
              await onDelete();
            }}
          />
        </div>
      )}
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
            <span className="shrink-0 text-sm text-muted-foreground">
              {t('All except')}
            </span>
          )}
          {shown.map((project) => (
            <ProjectSwatch key={project.id} project={project} />
          ))}
          {rest > 0 && (
            <span className="text-sm text-muted-foreground tabular-nums">
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
  onChange,
}: {
  configs: AIProviderWithoutSensitiveData[];
  value: string | null;
  onChange: (configId: string) => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3',
        CARD_SHADOW,
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/60">
        <MessageSquare className="size-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-none">{t('Chat provider')}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('Powers the built-in chat for everyone on this platform')}
        </p>
      </div>
      <Select value={value ?? undefined} onValueChange={onChange}>
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
    </div>
  );
}

function EmptyProviders({
  onConnect,
  allowWrite,
}: {
  onConnect: (provider?: AIProviderName) => void;
  allowWrite: boolean;
}) {
  const recommended = RECOMMENDED_PROVIDERS.map((provider) =>
    SUPPORTED_AI_PROVIDERS.find((info) => info.provider === provider),
  ).filter((info): info is AiProviderInfo => info !== undefined);
  const others = SUPPORTED_AI_PROVIDERS.filter(
    ({ provider }) => !RECOMMENDED_PROVIDERS.includes(provider),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border/60 bg-card px-6 py-14 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
          <Bot className="size-5 text-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold tracking-tight">
            {t('Connect your first provider')}
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            {t(
              'Bring an API key, then pick which models and projects can use it. Chat, agents, and AI steps run through it.',
            )}
          </p>
        </div>
        {allowWrite && (
          <Button onClick={() => onConnect()}>
            <Plus className="size-4" />
            {t('Connect a provider')}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {recommended.map((info) => (
          <AvailableProviderCard
            key={info.provider}
            info={info}
            tagline={recommendedTagline({ provider: info.provider })}
            recommended
            allowWrite={allowWrite}
            onConnect={() => onConnect(info.provider)}
          />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {t('Or choose another provider')}
        </p>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {others.map((info) => (
            <AvailableProviderCard
              key={info.provider}
              info={info}
              allowWrite={allowWrite}
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
  allowWrite,
  onConnect,
}: {
  info: AiProviderInfo;
  tagline?: string;
  recommended?: boolean;
  allowWrite: boolean;
  onConnect: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border',
        CARD_SHADOW,
      )}
    >
      <ProviderLogo info={info} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm font-medium leading-none">{info.name}</p>
        {tagline && (
          <p className="truncate text-xs text-muted-foreground">{tagline}</p>
        )}
      </div>
      {allowWrite && (
        <Button
          size="sm"
          variant={recommended ? 'default' : 'outline'}
          onClick={onConnect}
        >
          {t('Connect')}
        </Button>
      )}
    </div>
  );
}

const CARD_SHADOW =
  'shadow-[2px_0px_4px_-2px_rgba(0,0,0,0.05),0px_2px_4px_-2px_rgba(0,0,0,0.05)]';

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
