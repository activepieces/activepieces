import { AIProviderName } from '@activepieces/core-utils';
import {
  AIProviderWithoutSensitiveData,
  ApEdition,
  ApFlagId,
  Project,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Bot, KeyRound, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { RowMenu } from '@/components/custom/list/row-menu';
import { Page, PageHeader, PageSection } from '@/components/custom/page';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { ResourceCard, ResourceGrid } from '@/components/custom/resource-card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import {
  aiProviderMutations,
  aiProviderQueries,
} from '@/features/platform-admin';
import { projectCollectionUtils } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { aiKeyFormat } from './ai-key-format';
import { CapabilitiesPanel } from './capabilities-panel';
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
  const { mutate: toggleChatProvider, isPending: isSwitchingChatProvider } =
    aiProviderMutations.useToggleChatProvider({
      onSuccess: () => {
        refetch();
        toast.success(t('Chat provider updated'));
      },
    });

  const allProviders = providers ?? [];
  const keys = allProviders
    .filter((provider) => provider.provider !== AIProviderName.ACTIVEPIECES)
    .sort(
      (a, b) =>
        providerOrder({ provider: a.provider }) -
          providerOrder({ provider: b.provider }) ||
        a.name.localeCompare(b.name),
    );
  const chatKey = allProviders.find((provider) => provider.enabledForChat);
  const connectedProviders = new Set(keys.map((key) => key.provider));
  const available = SUPPORTED_AI_PROVIDERS.filter(
    ({ provider }) => !connectedProviders.has(provider),
  );
  const showCapabilities = edition !== ApEdition.COMMUNITY;

  return (
    <Page>
      <PageHeader
        title={t('AI')}
        description={t(
          'Bring the AI providers your company already pays for, decide which one runs chat, and what the assistant can do.',
        )}
      >
        {allowWrite && (
          <Button onClick={() => actions.connect()}>
            <Plus />
            {t('Connect a provider')}
          </Button>
        )}
      </PageHeader>

      {isLoading ? (
        <>
          <Skeleton className="h-16 rounded-2xl" />
          <ResourceGrid>
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </ResourceGrid>
        </>
      ) : isError ? (
        <Panel flush>
          <DataFetchErrorState entity={t('AI providers')} onRetry={refetch} />
        </Panel>
      ) : (
        <>
          <Panel flush>
            <SettingRows>
              <SettingRow
                title={t('Chat runs on')}
                description={
                  allProviders.length === 0
                    ? t('Connect a provider to power the built-in chat.')
                    : t('The key behind the built-in chat for everyone.')
                }
              >
                <Select
                  value={chatKey?.id}
                  onValueChange={(id) => {
                    const row = allProviders.find((config) => config.id === id);
                    if (row) {
                      toggleChatProvider({
                        providerId: row.id,
                        displayName: row.name,
                      });
                    }
                  }}
                  disabled={
                    !allowWrite ||
                    isSwitchingChatProvider ||
                    allProviders.length === 0
                  }
                >
                  <SelectTrigger
                    className="w-64"
                    aria-label={t('Chat runs on')}
                  >
                    <SelectValue placeholder={t('Choose a key')} />
                  </SelectTrigger>
                  <SelectContent>
                    {allProviders.map((config) => {
                      const info = aiKeyFormat.providerInfo({
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

          <PageSection title={t('Keys')}>
            {keys.length === 0 ? (
              <Panel flush>
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Bot />
                    </EmptyMedia>
                    <EmptyTitle>{t('No keys yet')}</EmptyTitle>
                    <EmptyDescription>
                      {t(
                        'Connect a provider your company already pays for. Steps, agents and chat can then use it, scoped to the models and projects you choose.',
                      )}
                    </EmptyDescription>
                  </EmptyHeader>
                  {allowWrite && (
                    <EmptyContent>
                      <Button onClick={() => actions.connect()}>
                        <Plus />
                        {t('Connect a provider')}
                      </Button>
                    </EmptyContent>
                  )}
                </Empty>
              </Panel>
            ) : (
              <ResourceGrid>
                {keys.map((key) => (
                  <KeyCard
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
              </ResourceGrid>
            )}
          </PageSection>

          {showCapabilities && (
            <PageSection>
              <CapabilitiesPanel
                providers={allProviders}
                allowWrite={allowWrite}
              />
            </PageSection>
          )}

          {allowWrite && available.length > 0 && (
            <PageSection
              title={t('Add a provider')}
              description={t('Bring your own key for any of these.')}
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {available.map((info) => (
                  <button
                    key={info.provider}
                    type="button"
                    onClick={() => actions.connect(info.provider)}
                    className="flex min-w-0 items-center gap-2.5 rounded-xl bg-panel px-3 py-2.5 text-left text-sm font-medium text-gray-12 shadow-edge outline-hidden transition-colors hover:bg-gray-3 focus-visible:ring-2 focus-visible:ring-accent-8"
                  >
                    <ProviderLogo info={info} />
                    <span className="min-w-0 truncate">{info.name}</span>
                  </button>
                ))}
              </div>
            </PageSection>
          )}
        </>
      )}
      {actions.dialogs}
    </Page>
  );
}

function KeyCard({
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
  return (
    <ResourceCard
      media={info && <ProviderLogo info={info} size="lg" />}
      title={
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{config.name}</span>
          {config.enabledForChat && (
            <Badge variant="outline">{t('Runs chat')}</Badge>
          )}
        </span>
      }
      status={<KeyStatusBadge status={config.status} />}
      meta={[
        info?.name ?? config.provider,
        aiKeyFormat.modelsSummary({ config }),
        aiKeyFormat.projectsSummary({ config, projects }),
      ].join(' · ')}
      onOpen={allowWrite ? onOpen : undefined}
      menu={
        allowWrite ? (
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
        ) : undefined
      }
    />
  );
}

function providerOrder({ provider }: { provider: AIProviderName }): number {
  return SUPPORTED_AI_PROVIDERS.findIndex(
    (candidate) => candidate.provider === provider,
  );
}
