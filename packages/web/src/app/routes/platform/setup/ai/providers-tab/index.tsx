import { AIProviderName, tryCatch } from '@activepieces/core-utils';
import { AIProviderWithoutSensitiveData, Project } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Bot, ChevronRight, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Page, PageHeader, PageSection } from '@/components/custom/page';
import { Panel, SettingRows } from '@/components/custom/panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
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
  aiProviderKeys,
  aiProviderMutations,
  aiProviderQueries,
} from '@/features/platform-admin';
import { projectCollectionUtils } from '@/features/projects';
import { cn } from '@/lib/utils';

import { TitleWithCount } from '../components/title-with-count';

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
    aiProviderMutations.useToggleChatProvider({
      onSuccess: () => {
        refetch();
        toast.success(t('Chat provider updated'));
      },
    });
  const { mutateAsync: deleteProvider } =
    aiProviderMutations.useDeleteAiProvider({
      onSuccess: () => refetch(),
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
  if (activeConfig && activeInfo) {
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

  return (
    <Page>
      <PageHeader
        title={<TitleWithCount title={t('Providers')} count={configs.length} />}
        description={
          configs.length === 0
            ? t(
                'Connect a provider to turn on chat, agents, and AI steps across your platform.',
              )
            : t('Each key has its own models and project access.')
        }
      >
        {allowWrite && (
          <Button onClick={() => openConnect()}>
            <Plus />
            {t('Add key')}
          </Button>
        )}
      </PageHeader>

      {isProvidersError ? (
        <DataFetchErrorState entity={t('AI providers')} onRetry={refetch} />
      ) : configs.length === 0 ? (
        <EmptyProviders onConnect={openConnect} allowWrite={allowWrite} />
      ) : (
        <>
          {allowWrite && (
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
              allowWrite={allowWrite}
              onAdd={() => openConnect(provider)}
              onOpen={openConfig}
              onDelete={(id) => deleteProvider(id)}
            />
          ))}
          {available.length > 0 && (
            <PageSection
              title={
                <TitleWithCount
                  title={t('Also available')}
                  count={available.length}
                />
              }
              description={t('Bring your own API key to connect any of these.')}
            >
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
            </PageSection>
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
    </Page>
  );
}

function ProviderGroup({
  provider,
  configs,
  projects,
  onAdd,
  onOpen,
  onDelete,
}: {
  provider: AIProviderName;
  configs: AIProviderWithoutSensitiveData[];
  projects: Project[];
  onAdd: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => Promise<unknown>;
}) {
  const info = providerInfoOf({ provider });
  if (!info) {
    return null;
  }

  return (
    <Panel flush>
      <ItemGroup className="px-1">
        <Item>
          <ItemMedia>
            <ProviderLogo info={info} />
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle>{info.name}</ItemTitle>
            <ItemDescription>
              {t('configurationsCount', { count: configs.length })}
            </ItemDescription>
          </ItemContent>
          {allowWrite && (
            <ItemActions>
              <Button variant="ghost" size="sm" onClick={onAdd}>
                <Plus />
                {t('Add key')}
              </Button>
            </ItemActions>
          )}
        </Item>
        {configs.map((config) => (
          <ConfigRow
            key={config.id}
            config={config}
            projects={projects}
            onOpen={() => onOpen(config.id)}
            onDelete={() => onDelete(config.id)}
          />
        ))}
      </ItemGroup>
    </Panel>
  );
}

function ConfigRow({
  config,
  projects,
  onOpen,
  onDelete,
}: {
  config: AIProviderWithoutSensitiveData;
  projects: Project[];
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
    <Item
      role={allowWrite ? 'button' : undefined}
      tabIndex={allowWrite ? 0 : undefined}
      onClick={allowWrite ? onOpen : undefined}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        'group flex-nowrap gap-4',
        allowWrite &&
          'cursor-pointer hover:bg-gray-4 active:bg-gray-5 focus-visible:bg-gray-4',
      )}
    >
      <ItemContent className="min-w-0">
        <ItemTitle className="flex-nowrap">
          <span className="min-w-0 truncate">{config.name}</span>
          {config.enabledForChat && <Badge variant="info">{t('Chat')}</Badge>}
          <KeyStatusBadge status={config.status} />
        </ItemTitle>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="w-fit truncate text-sm text-gray-11">
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
      </ItemContent>

      {config.projectScope !== 'all' && (
        <div className="flex min-w-0 items-center gap-2">
          <ProjectChips
            projects={namedProjects}
            excluded={config.projectScope === 'except'}
            allowedCount={allowedProjectCount}
          />
        </div>
      )}

      {allowWrite && (
        <div
          className="flex shrink-0 items-center gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-gray-11 opacity-0 transition-opacity hover:bg-danger-3 hover:text-danger-11 focus-visible:opacity-100 group-hover:opacity-100"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 />
                <span className="sr-only">{t('Delete')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('Delete')}</TooltipContent>
          </Tooltip>
          <ChevronRight className="size-4 text-gray-11 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-gray-12" />
          <ConfirmationDeleteDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title={t('Delete {name}', { name: config.name })}
            message={t('Steps and agents using this key will stop working.')}
            entityName={config.name}
            showToast={true}
            mutationFn={async () => {
              await onDelete();
            }}
          />
        </div>
      )}
    </Item>
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
    <Panel flush>
      <SettingRows>
        <Item>
          <ItemMedia variant="icon">
            <MessageSquare className="text-gray-11" />
          </ItemMedia>
          <ItemContent className="min-w-0">
            <ItemTitle>{t('Chat provider')}</ItemTitle>
            <ItemDescription>
              {t('Powers the built-in chat for everyone on this platform')}
            </ItemDescription>
          </ItemContent>
          <ItemActions>
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
                        <span className="min-w-0 truncate">{config.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </ItemActions>
        </Item>
      </SettingRows>
    </Panel>
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
      <Panel flush>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Bot />
            </EmptyMedia>
            <EmptyTitle>{t('Connect your first provider')}</EmptyTitle>
            <EmptyDescription>
              {t(
                'Bring an API key, then pick which models and projects can use it. Chat, agents, and AI steps run through it.',
              )}
            </EmptyDescription>
          </EmptyHeader>
          {allowWrite && (
            <EmptyContent>
              <Button onClick={() => onConnect()}>
                <Plus />
                {t('Connect a provider')}
              </Button>
            </EmptyContent>
          )}
        </Empty>
      </Panel>
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
        <p className="text-sm font-medium text-gray-11">
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
    <Panel flush>
      <Item>
        <ItemMedia>
          <ProviderLogo info={info} />
        </ItemMedia>
        <ItemContent className="min-w-0">
          <ItemTitle className="truncate">{info.name}</ItemTitle>
          {tagline && (
            <ItemDescription className="truncate">{tagline}</ItemDescription>
          )}
        </ItemContent>
        {allowWrite && (
          <ItemActions>
            <Button
              size="sm"
              variant={recommended ? 'default' : 'outline'}
              onClick={onConnect}
            >
              {t('Connect')}
            </Button>
          </ItemActions>
        )}
      </Item>
    </Panel>
  );
}

function ProvidersSkeleton() {
  return (
    <Page>
      <PageHeader title={t('Providers')} />
      <Panel>
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-52 rounded-lg" />
        </div>
      </Panel>
      {[0, 1].map((group) => (
        <Panel key={group}>
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 shrink-0 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          {[0, 1].map((row) => (
            <div key={row} className="flex flex-col gap-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-56" />
            </div>
          ))}
        </Panel>
      ))}
    </Page>
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
