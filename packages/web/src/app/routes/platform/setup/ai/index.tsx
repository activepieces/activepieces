import { AIProviderName } from '@activepieces/core-utils';
import {
  AIProviderWithoutSensitiveData,
  ApEdition,
  ApFlagId,
  Project,
} from '@activepieces/shared';
import { t } from 'i18next';
import { KeyRound, MessageSquare, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { AdminPageHeader } from '@/app/routes/platform/admin-page-header';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { RowMenu } from '@/components/custom/list/row-menu';
import { Page } from '@/components/custom/page';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
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
  aiProviderMutations,
  aiProviderQueries,
} from '@/features/platform-admin';
import { projectCollectionUtils } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

import { aiKeyFormat } from './ai-key-format';
import { CapabilityRows } from './capabilities-panel';
import { KeyStatusBadge } from './providers-tab/key-status';
import { ProviderLogo } from './providers-tab/provider-logo';
import { useAiKeyActions } from './use-ai-key-actions';

export default function AIProvidersPage() {
  const [searchParams] = useSearchParams();
  const legacyConfigId = searchParams.get('config');
  if (legacyConfigId) {
    return <Navigate to={`/platform/ai/keys/${legacyConfigId}`} replace />;
  }
  return <AIPage />;
}

function AIPage() {
  const navigate = useNavigate();
  const { platform } = platformHooks.useCurrentPlatform();
  const allowWrite = platform.plan.aiProvidersEnabled;
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const {
    data: providers,
    isLoading,
    isError,
    refetch,
  } = aiProviderQueries.useAiProviderConfigs();
  const { data: projects } = projectCollectionUtils.useAllPlatformProjects();
  const openKey = (id: string) => navigate(`/platform/ai/keys/${id}`);
  const actions = useAiKeyActions({ refetch, onConnected: openKey });

  const allProviders = providers ?? [];
  const keys = allProviders
    .filter((provider) => provider.provider !== AIProviderName.ACTIVEPIECES)
    .sort(
      (a, b) =>
        providerOrder({ provider: a.provider }) -
          providerOrder({ provider: b.provider }) ||
        a.name.localeCompare(b.name),
    );
  const showCapabilities = edition !== ApEdition.COMMUNITY;
  const hasKeys = keys.length > 0;

  return (
    <Page width="narrow">
      <AdminPageHeader page="aiProviders">
        {allowWrite && hasKeys && (
          <Button onClick={() => actions.connect()}>
            <Plus />
            {t('Connect a provider')}
          </Button>
        )}
      </AdminPageHeader>

      {isLoading ? (
        <>
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </>
      ) : isError ? (
        <Panel flush>
          <DataFetchErrorState entity={t('AI providers')} onRetry={refetch} />
        </Panel>
      ) : (
        <>
          {hasKeys ? (
            <Panel
              flush
              title={t('Providers')}
              description={t(
                'Open a key to choose which models and projects it serves.',
              )}
            >
              <SettingRows>
                {keys.map((key) => (
                  <KeyRow
                    key={key.id}
                    config={key}
                    projects={projects}
                    allowWrite={allowWrite}
                    onOpen={() => openKey(key.id)}
                    onRecheck={() => actions.recheck(key)}
                    onReplace={() => actions.replaceCredentials(key)}
                    onDelete={() => actions.askToDelete(key)}
                  />
                ))}
              </SettingRows>
            </Panel>
          ) : (
            <FirstProviderPanel
              allowWrite={allowWrite}
              onPick={(provider) => actions.connect(provider)}
            />
          )}

          {(hasKeys || showCapabilities) && (
            <Panel
              flush
              title={t('Assistant')}
              description={t(
                'The built-in chat, and what it can do beyond the model itself.',
              )}
            >
              <SettingRows>
                {hasKeys && (
                  <ChatModelRow
                    providers={allProviders}
                    allowWrite={allowWrite}
                    onChanged={() => refetch()}
                  />
                )}
                {showCapabilities && (
                  <CapabilityRows
                    providers={allProviders}
                    allowWrite={allowWrite}
                  />
                )}
              </SettingRows>
            </Panel>
          )}
        </>
      )}
      {actions.dialogs}
    </Page>
  );
}

function FirstProviderPanel({
  allowWrite,
  onPick,
}: {
  allowWrite: boolean;
  onPick: (provider?: AIProviderName) => void;
}) {
  const featured = FEATURED_PROVIDERS.map((provider) =>
    aiKeyFormat.providerInfo({ provider }),
  ).filter((info): info is AiProviderInfo => info !== undefined);
  return (
    <Panel
      title={t('Connect your first provider')}
      description={t(
        'Bring a key your company already pays for. You choose which models and projects can use it.',
      )}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {featured.map((info) => (
          <ProviderTile
            key={info.provider}
            disabled={!allowWrite}
            onClick={() => onPick(info.provider)}
          >
            <ProviderLogo info={info} />
            <span className="min-w-0 flex-1 truncate">{info.name}</span>
          </ProviderTile>
        ))}
        <ProviderTile disabled={!allowWrite} onClick={() => onPick()}>
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-gray-3 text-gray-11">
            <Plus className="size-3.5" />
          </span>
          <span className="min-w-0 flex-1 truncate">
            {t('Other providers')}
          </span>
          <span className="text-xs text-gray-11 tabular-nums">
            {t('{count} more', {
              count: SUPPORTED_AI_PROVIDERS.length - featured.length,
            })}
          </span>
        </ProviderTile>
      </div>
    </Panel>
  );
}

function ProviderTile({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-12 min-w-0 items-center gap-3 rounded-xl border px-3 text-left text-sm font-medium text-gray-12 outline-hidden transition-colors hover:bg-gray-2 focus-visible:ring-2 focus-visible:ring-accent-8 disabled:pointer-events-none disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function ChatModelRow({
  providers,
  allowWrite,
  onChanged,
}: {
  providers: AIProviderWithoutSensitiveData[];
  allowWrite: boolean;
  onChanged: () => void;
}) {
  const chatKey = providers.find((provider) => provider.enabledForChat);
  const { mutate: toggleChatProvider, isPending } =
    aiProviderMutations.useToggleChatProvider({
      onSuccess: () => {
        onChanged();
        toast.success(t('Chat provider updated'));
      },
    });
  return (
    <SettingRow
      icon={<MessageSquare />}
      title={t('Chat')}
      description={t('The key that answers in chat, for everyone.')}
    >
      <Select
        value={chatKey?.id}
        onValueChange={(id) => {
          const row = providers.find((config) => config.id === id);
          if (row) {
            toggleChatProvider({ providerId: row.id, displayName: row.name });
          }
        }}
        disabled={!allowWrite || isPending}
      >
        <SelectTrigger className="w-56" aria-label={t('Chat')}>
          <SelectValue placeholder={t('Choose a key')} />
        </SelectTrigger>
        <SelectContent align="end">
          {providers.map((config) => {
            const info = aiKeyFormat.providerInfo({
              provider: config.provider,
            });
            return (
              <SelectItem key={config.id} value={config.id}>
                <span className="flex min-w-0 items-center gap-2">
                  {info && <ProviderLogo info={info} size="sm" />}
                  <span className="min-w-0 truncate">{config.name}</span>
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </SettingRow>
  );
}

function KeyRow({
  config,
  projects,
  allowWrite,
  onOpen,
  onRecheck,
  onReplace,
  onDelete,
}: {
  config: AIProviderWithoutSensitiveData;
  projects: Project[];
  allowWrite: boolean;
  onOpen: () => void;
  onRecheck: () => void;
  onReplace: () => void;
  onDelete: () => void;
}) {
  const info = aiKeyFormat.providerInfo({ provider: config.provider });
  const scopeDetails = scopeDetailsOf({ config, projects });
  return (
    <Item
      role={allowWrite ? 'button' : undefined}
      tabIndex={allowWrite ? 0 : undefined}
      onClick={allowWrite ? onOpen : undefined}
      onKeyDown={(event) => {
        if (
          allowWrite &&
          event.target === event.currentTarget &&
          event.key === 'Enter'
        ) {
          onOpen();
        }
      }}
      className={cn(
        'items-center border-x-0 border-b-0 px-5 outline-hidden',
        allowWrite && 'cursor-pointer hover:bg-gray-2 focus-visible:bg-gray-2',
      )}
    >
      {info && (
        <ItemMedia>
          <ProviderLogo info={info} />
        </ItemMedia>
      )}
      <ItemContent className="min-w-0">
        <ItemTitle className="w-full min-w-0">
          <span className="truncate">{config.name}</span>
        </ItemTitle>
        <ItemDescription>
          {config.enabledForChat && (
            <span className="font-medium text-accent-11">
              {t('Runs chat')}
              {' · '}
            </span>
          )}
          {scopeDetails.length === 0 ? (
            summaryOf({ config, projects, info })
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>{summaryOf({ config, projects, info })}</span>
              </TooltipTrigger>
              <TooltipContent align="start" className="max-w-80">
                <span className="flex flex-col gap-1">
                  {scopeDetails.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </span>
              </TooltipContent>
            </Tooltip>
          )}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <KeyStatusBadge status={config.status} />
        {allowWrite && (
          <RowMenu
            items={[
              { label: t('Recheck'), icon: RefreshCw, onSelect: onRecheck },
              {
                label: t('Replace credentials'),
                icon: KeyRound,
                onSelect: onReplace,
              },
              {
                label: t('Delete key'),
                icon: Trash2,
                destructive: true,
                onSelect: onDelete,
              },
            ]}
          />
        )}
      </ItemActions>
    </Item>
  );
}

function summaryOf({
  config,
  projects,
  info,
}: {
  config: AIProviderWithoutSensitiveData;
  projects: Project[];
  info: AiProviderInfo | undefined;
}): string {
  return [
    info?.name ?? config.provider,
    aiKeyFormat.modelsSummary({ config }),
    aiKeyFormat.projectsSummary({ config, projects }),
  ].join(' · ');
}

function scopeDetailsOf({
  config,
  projects,
}: {
  config: AIProviderWithoutSensitiveData;
  projects: Project[];
}): string[] {
  const models =
    config.modelScope === 'selected' && config.modelIds.length > 0
      ? [t('Models: {list}', { list: config.modelIds.join(', ') })]
      : [];
  const projectNames = projects
    .filter((project) => config.projectIds.includes(project.id))
    .map((project) => project.displayName);
  const scoped =
    config.projectScope !== 'all' && projectNames.length > 0
      ? [
          config.projectScope === 'except'
            ? t('All projects except: {list}', {
                list: projectNames.join(', '),
              })
            : t('Projects: {list}', { list: projectNames.join(', ') }),
        ]
      : [];
  return [...models, ...scoped];
}

function providerOrder({ provider }: { provider: AIProviderName }): number {
  return SUPPORTED_AI_PROVIDERS.findIndex(
    (candidate) => candidate.provider === provider,
  );
}

const FEATURED_PROVIDERS: AIProviderName[] = [
  AIProviderName.ANTHROPIC,
  AIProviderName.OPENAI,
  AIProviderName.GOOGLE,
  AIProviderName.AZURE,
  AIProviderName.BEDROCK,
];
