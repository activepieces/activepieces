import { AIProviderName, tryCatch } from '@activepieces/core-utils';
import { AIProviderWithoutSensitiveData, Project } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  Bot,
  ChevronRight,
  KeyRound,
  MoreHorizontal,
  Plus,
  RefreshCw,
  TriangleAlert,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { Page, PageHeader, PageSection } from '@/components/custom/page';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
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
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/format-utils';

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
  const [deleting, setDeleting] =
    useState<AIProviderWithoutSensitiveData | null>(null);

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
  const needsAttention = configs.filter((config) => config.status !== 'active');
  const sortedConfigs = [...configs].sort(
    (a, b) =>
      providerOrder({ provider: a.provider }) -
        providerOrder({ provider: b.provider }) || a.name.localeCompare(b.name),
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

  const columns: ColumnDef<
    RowDataWithActions<AIProviderWithoutSensitiveData>
  >[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Key')} />
      ),
      cell: ({ row }) => {
        const info = providerInfoOf({ provider: row.original.provider });
        return (
          <div className="flex min-w-0 items-center gap-3">
            {info && <ProviderLogo info={info} />}
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="truncate font-medium text-gray-12">
                {row.original.name}
              </span>
              <span className="shrink-0 truncate text-xs text-gray-11">
                {row.original.enabledForChat
                  ? t('{provider} · powers chat', {
                      provider: info?.name ?? row.original.provider,
                    })
                  : info?.name ?? row.original.provider}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: 'models',
      size: 160,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Models')} />
      ),
      cell: ({ row }) => (
        <span className="text-gray-11 tabular-nums">
          {row.original.modelScope === 'all'
            ? t('All models')
            : t('modelsCount', { count: row.original.modelIds.length })}
        </span>
      ),
    },
    {
      id: 'projects',
      size: 240,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Projects')} />
      ),
      cell: ({ row }) => (
        <ProjectScopeCell config={row.original} projects={projects} />
      ),
    },
    {
      id: 'status',
      size: 150,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Status')} />
      ),
      cell: ({ row }) => <KeyStatusBadge status={row.original.status} />,
    },
    {
      id: 'checked',
      size: 130,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Last checked')} />
      ),
      cell: ({ row }) => (
        <span className="text-gray-11 tabular-nums">
          {row.original.statusUpdated
            ? formatUtils.formatDate(new Date(row.original.statusUpdated))
            : t('Never')}
        </span>
      ),
    },
    {
      id: 'actions',
      size: 56,
      cell: ({ row }) =>
        allowWrite ? (
          <div className="flex justify-end">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('More actions')}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem onSelect={() => openConfig(row.original.id)}>
                  <ChevronRight />
                  {t('Open')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => recheckProvider(row.original.id)}
                >
                  <RefreshCw />
                  {t('Recheck')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => openReplaceCredentials(row.original)}
                >
                  <KeyRound />
                  {t('Replace credentials')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleting(row.original)}
                >
                  <Trash2 />
                  {t('Delete key')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null,
    },
  ];

  return (
    <Page>
      <PageHeader
        title={t('AI')}
        description={
          configs.length === 0
            ? t(
                'Bring the AI providers your company already pays for, scoped to models and projects.',
              )
            : t(
                '{keys, plural, =1 {1 key} other {# keys}} · {providers, plural, =1 {1 provider connected} other {# providers connected}}',
                {
                  keys: configs.length,
                  providers: connectedProviders.length,
                },
              )
        }
      >
        {allowWrite && (
          <Button onClick={() => openConnect()}>
            <Plus />
            {t('Connect a provider')}
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
            <Panel flush>
              <SettingRows>
                <SettingRow
                  title={t('Chat provider')}
                  description={t(
                    'Powers the built-in chat for everyone on the platform.',
                  )}
                >
                  <Select
                    value={chatProviderRow?.id}
                    onValueChange={selectChatConfig}
                    disabled={isSwitchingChatProvider}
                  >
                    <SelectTrigger
                      className="w-64"
                      aria-label={t('Chat provider')}
                    >
                      <SelectValue placeholder={t('Select a key')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(providers ?? []).map((config) => {
                        const info = providerInfoOf({
                          provider: config.provider,
                        });
                        return (
                          <SelectItem key={config.id} value={config.id}>
                            <span className="flex min-w-0 items-center gap-2">
                              {info && <ProviderLogo info={info} size="sm" />}
                              <span className="min-w-0 truncate">
                                {config.name}
                              </span>
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </SettingRow>
              </SettingRows>
            </Panel>
          )}

          {needsAttention.length > 0 && (
            <Alert variant="destructive">
              <TriangleAlert />
              <AlertDescription className="flex flex-col items-start gap-2">
                <span>
                  {t(
                    '{count, plural, =1 {1 key needs attention.} other {# keys need attention.}}',
                    { count: needsAttention.length },
                  )}
                </span>
                {allowWrite && (
                  <span className="flex flex-wrap gap-2">
                    {needsAttention.map((config) => (
                      <Button
                        key={config.id}
                        variant="outline"
                        size="xs"
                        onClick={() => openConfig(config.id)}
                      >
                        {config.name}
                      </Button>
                    ))}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <DataTable
            emptyStateTextTitle={t('No keys yet')}
            emptyStateTextDescription=""
            emptyStateIcon={<Bot className="size-6 text-gray-9" />}
            columns={columns}
            page={{ data: sortedConfigs, next: null, previous: null }}
            onRowClick={allowWrite ? (row) => openConfig(row.id) : undefined}
            isLoading={false}
            isError={false}
            errorStateEntity={t('AI providers')}
            hidePagination={true}
          />

          {available.length > 0 && (
            <PageSection
              title={t('Also available')}
              description={t('Providers nobody has connected yet.')}
            >
              <ProviderCardGrid
                providers={available}
                allowWrite={allowWrite}
                onConnect={openConnect}
              />
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
      {deleting && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          title={t('Delete {name}?', { name: deleting.name })}
          description={t(
            'The credentials are removed and cannot be recovered. Reconnecting the provider means entering them again.',
          )}
          consequence={t('Steps and agents using this key stop working.')}
          successMessage={t('Deleted {name}', { name: deleting.name })}
          confirmLabel={t('Delete key')}
          onConfirm={async () => {
            await deleteProvider(deleting.id);
          }}
        />
      )}
    </Page>
  );
}

function ProjectScopeCell({
  config,
  projects,
}: {
  config: AIProviderWithoutSensitiveData;
  projects: Project[];
}) {
  if (config.projectScope === 'all') {
    return <span className="text-gray-11">{t('All projects')}</span>;
  }
  const named = projects.filter((project) =>
    config.projectIds.includes(project.id),
  );
  const shown = named.slice(0, 3);
  const rest = named.length - shown.length;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-gray-12 tabular-nums">
            {config.projectScope === 'except'
              ? t('All except {count}', { count: named.length })
              : t('Only {count}', { count: named.length })}
          </span>
          <span className="flex items-center gap-1">
            {shown.map((project) => (
              <ProjectSwatch key={project.id} project={project} />
            ))}
            {rest > 0 && (
              <span className="text-xs text-gray-11 tabular-nums">+{rest}</span>
            )}
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        {named.map((project) => project.displayName).join(', ')}
      </TooltipContent>
    </Tooltip>
  );
}

function EmptyProviders({
  onConnect,
}: {
  onConnect: (provider?: AIProviderName) => void;
}) {
  const recommended = SUPPORTED_AI_PROVIDERS.filter(({ provider }) =>
    RECOMMENDED_PROVIDERS.includes(provider),
  );
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
            <EmptyTitle>{t('No providers connected yet')}</EmptyTitle>
            <EmptyDescription>
              {t(
                'Connect a provider your company already pays for. Steps, agents and the built-in chat can then use it, scoped to the models and projects you choose.',
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
      <PageSection
        title={t('Recommended')}
        description={t('The two providers most teams start with.')}
      >
        <ProviderCardGrid
          providers={recommended}
          allowWrite={allowWrite}
          onConnect={onConnect}
          primary
        />
      </PageSection>
      <PageSection
        title={t('Also available')}
        description={t('Bring your own API key to connect any of these.')}
      >
        <ProviderCardGrid
          providers={others}
          allowWrite={allowWrite}
          onConnect={onConnect}
        />
      </PageSection>
    </>
  );
}

function ProviderCardGrid({
  providers,
  allowWrite,
  onConnect,
  primary = false,
}: {
  providers: AiProviderInfo[];
  allowWrite: boolean;
  onConnect: (provider: AIProviderName) => void;
  primary?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {providers.map((info) => (
        <Panel key={info.provider}>
          <div className="flex min-w-0 items-center gap-3">
            <ProviderLogo info={info} size="lg" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-semibold text-gray-12">
                {info.name}
              </span>
              <span className="truncate text-xs text-gray-11">
                {providerTagline({ provider: info.provider })}
              </span>
            </div>
          </div>
          {allowWrite && (
            <Button
              variant={primary ? 'default' : 'outline'}
              className="w-full"
              onClick={() => onConnect(info.provider)}
            >
              {t('Connect')}
            </Button>
          )}
        </Panel>
      ))}
    </div>
  );
}

function ProvidersSkeleton() {
  return (
    <Page>
      <PageHeader title={t('AI')} />
      <Skeleton className="h-16 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
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

function providerOrder({ provider }: { provider: AIProviderName }): number {
  return SUPPORTED_AI_PROVIDERS.findIndex(
    (candidate) => candidate.provider === provider,
  );
}

function providerTagline({ provider }: { provider: AIProviderName }): string {
  switch (provider) {
    case AIProviderName.ANTHROPIC:
      return t('Claude models. Strong for chat and agents.');
    case AIProviderName.OPENAI:
      return t('GPT models. Broad ecosystem and tooling.');
    case AIProviderName.GOOGLE:
      return t('Gemini models. Long context and multimodal.');
    case AIProviderName.MISTRAL:
      return t('Mistral and Codestral models. European hosting.');
    case AIProviderName.DEEPSEEK:
      return t('DeepSeek models. Strong reasoning at low cost.');
    case AIProviderName.XAI:
      return t('Grok models from xAI.');
    case AIProviderName.QWEN:
      return t('Qwen models from Alibaba Cloud.');
    case AIProviderName.ZAI:
      return t('GLM models from Z.ai.');
    case AIProviderName.MINIMAX:
      return t('MiniMax models. Text, speech and video.');
    case AIProviderName.MOONSHOT:
      return t('Kimi models from Moonshot AI.');
    case AIProviderName.AZURE:
      return t('OpenAI models on your Azure subscription.');
    case AIProviderName.BEDROCK:
      return t('Claude, Llama and more on your AWS account.');
    case AIProviderName.VERTEX:
      return t('Gemini and partner models on Google Cloud.');
    case AIProviderName.OPENROUTER:
      return t('One key, every major model. Routed and metered.');
    case AIProviderName.CLOUDFLARE_GATEWAY:
      return t('Cache, log and rate-limit calls to any provider.');
    case AIProviderName.CUSTOM:
      return t('Any endpoint that speaks the OpenAI API.');
    default:
      return '';
  }
}

const RECOMMENDED_PROVIDERS: AIProviderName[] = [
  AIProviderName.ANTHROPIC,
  AIProviderName.OPENAI,
];
