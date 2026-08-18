import {
  AgentSummary,
  MAX_DRAFT_PROMPT_LENGTH,
  PROJECT_COLOR_PALETTE,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  ArrowUp,
  Settings2,
  ChevronsUpDown,
  LayoutGrid,
  List,
  Plus,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { LockedFeatureGuard } from '@/app/components/locked-feature-guard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { AgentCard } from '@/features/agents/agent-card';
import { CreateAgentDialog } from '@/features/agents/create-agent-dialog';
import {
  agentsMutations,
  agentsQueries,
} from '@/features/agents/hooks/agents-hooks';
import { createAgentUtils } from '@/features/agents/lib/create-agent-utils';
import { aiProviderQueries } from '@/features/platform-admin/hooks/ai-provider-hooks';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const SUGGESTIONS = [
  'Triage support tickets',
  'Research a company',
  'Enrich a lead',
];

const SORT_LABELS = {
  updated: 'Recently updated',
  created: 'Recently created',
  name: 'Name',
} as const;

const SORT_COMPARATORS: Record<
  AgentSort,
  (left: AgentSummary, right: AgentSummary) => number
> = {
  updated: (left, right) => right.updated.localeCompare(left.updated),
  created: (left, right) => right.created.localeCompare(left.created),
  name: (left, right) => left.displayName.localeCompare(right.displayName),
};

const AgentsPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  return (
    <LockedFeatureGuard
      locked={!platform.plan.agentsEnabled}
      lockTitle={t('Unlock Agents')}
      lockDescription={t('Build an agent once, then use it in any flow.')}
      featureKey="AGENTS"
    >
      <AgentsPageContent />
    </LockedFeatureGuard>
  );
};

const AgentsPageContent = () => {
  const [search, setSearch] = useState('');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [sort, setSort] = useState<AgentSort>('updated');
  const [prompt, setPrompt] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { project } = projectCollectionUtils.useCurrentProject();
  const { data: allProjects } = projectCollectionUtils.useAll();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data, isLoading } = agentsQueries.useAgents({
    enabled: platform.plan.agentsEnabled,
  });

  const agents = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const matching = (data?.data ?? []).filter(
      (agent) =>
        needle.length === 0 ||
        agent.displayName.toLowerCase().includes(needle) ||
        (agent.description ?? '').toLowerCase().includes(needle),
    );
    return [...matching].sort(SORT_COMPARATORS[sort]);
  }, [data, search, sort]);

  const draftAgent = agentsMutations.useDraftAgent();
  const createAgent = agentsMutations.useCreateAgent({
    onSuccess: (agent) =>
      navigate(`/projects/${agent.projectId}/agents/${agent.id}`),
  });
  const {
    data: chatProvider,
    isLoading: isLoadingProvider,
    isError: providerLookupFailed,
  } = aiProviderQueries.useChatProvider();
  const needsProvider =
    !isLoadingProvider && !providerLookupFailed && chatProvider === undefined;
  const isBuilding = draftAgent.isPending || createAgent.isPending;
  const buildError = draftAgent.error ?? createAgent.error ?? null;

  const buildAgent = (text?: string) => {
    const trimmed = (text ?? prompt).trim();
    if (trimmed.length === 0 || isBuilding) {
      return;
    }
    setPrompt(trimmed);
    draftAgent.mutate(
      { projectId: project.id, prompt: trimmed },
      {
        onSuccess: (draft) =>
          createAgent.mutate(
            createAgentUtils.buildCreateRequest({
              draft,
              projectId: project.id,
            }),
          ),
      },
    );
  };

  const projectById = useMemo(
    () => new Map((allProjects ?? []).map((entry) => [entry.id, entry])),
    [allProjects],
  );

  return (
    <div className="flex w-full flex-col">
      <section className="flex flex-col items-center gap-2 px-12 pt-8">
        <h1 className="text-2xl leading-[30px] tracking-[-0.01em]">
          {isBuilding
            ? t('Building your agent')
            : t('What should your agent do?')}
        </h1>
        <p className="text-[15px] leading-[18px] text-muted-foreground">
          {needsProvider
            ? t('Connect an AI provider and I can start building agents.')
            : isBuilding
            ? t('Picking the tools and writing its instructions')
            : t(
                "Describe what you need. I'll pick the tools and set up the steps.",
              )}
        </p>
        {needsProvider && (
          <Button
            className="mt-4 gap-2"
            onClick={() => navigate('/platform/setup/ai')}
          >
            <Settings2 size={16} />
            {t('Connect an AI provider')}
          </Button>
        )}
        <div
          className={cn(
            'mt-4 flex min-h-14 w-full max-w-[680px] items-end gap-3.5 rounded-[28px] border bg-muted ps-5 pe-2 py-2 transition-colors',
            isBuilding ? 'border-primary/40' : 'border-border',
            needsProvider && 'hidden',
          )}
        >
          <Textarea
            value={prompt}
            minRows={1}
            maxRows={8}
            maxLength={MAX_DRAFT_PROMPT_LENGTH}
            disabled={isBuilding}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                buildAgent();
              }
            }}
            placeholder={t(
              'Draft weekly launch posts and file them in Notion…',
            )}
            className="min-h-10 resize-none border-0 bg-transparent px-0 py-2.5 text-base leading-5 shadow-none focus-visible:ring-0 placeholder:text-neutral-400"
          />
          <Button
            size="icon"
            loading={isBuilding}
            onClick={() => buildAgent()}
            className="size-10 shrink-0 rounded-full"
          >
            <ArrowUp size={16} strokeWidth={2.2} />
          </Button>
        </div>
        {buildError !== null && (
          <p className="max-w-[680px] text-center text-[13px] leading-4 text-destructive">
            {api.extractServerErrorMessage(
              buildError,
              t("That didn't work. Try describing the agent another way."),
            )}
          </p>
        )}
        <div className="mt-[14px] flex flex-wrap items-center justify-center gap-2">
          <span className="text-[13px] leading-4 text-muted-foreground">
            {t('Try:')}
          </span>
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => buildAgent(t(suggestion))}
              className="rounded-full border border-border px-3 py-[5px] text-[13px] leading-4 transition-colors hover:bg-accent"
            >
              {t(suggestion)}
            </button>
          ))}
        </div>
      </section>

      <section className="flex w-full flex-col gap-5 px-12 pt-11 pb-12">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-semibold leading-6 tracking-[-0.01em]">
              {t('Your agents')}
            </h2>
            <span className="text-[15px] leading-[18px] text-muted-foreground">
              {agents.length}
            </span>
            {data?.next && (
              <span className="text-[13px] leading-4 text-muted-foreground">
                {t('Showing the first {count}', { count: agents.length })}
              </span>
            )}
          </div>
          <div className="ms-auto flex items-center gap-3">
            <div className="flex h-8 w-[180px] shrink-0 items-center gap-2 rounded-full border border-border bg-muted px-3">
              <Search size={14} className="shrink-0 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('Search agents')}
                className="w-full bg-transparent text-xs leading-4 outline-none placeholder:text-muted-foreground"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 items-center gap-2 rounded-md border border-border px-3 text-[13px] leading-4 transition-colors hover:bg-accent"
                >
                  {t(SORT_LABELS[sort])}
                  <ChevronsUpDown size={14} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                  value={sort}
                  onValueChange={(value) => setSort(value as AgentSort)}
                >
                  {Object.entries(SORT_LABELS).map(([value, label]) => (
                    <DropdownMenuRadioItem key={value} value={value}>
                      {t(label)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex h-8 items-center gap-[2px] rounded-full border border-border p-[3px]">
              <button
                type="button"
                aria-label={t('Grid view')}
                onClick={() => setLayout('grid')}
                className={cn(
                  'flex h-6 w-8 shrink-0 items-center justify-center rounded-full',
                  layout === 'grid' && 'bg-neutral-100',
                )}
              >
                <LayoutGrid
                  size={15}
                  className={cn(layout !== 'grid' && 'text-neutral-400')}
                />
              </button>
              <button
                type="button"
                aria-label={t('List view')}
                onClick={() => setLayout('list')}
                className={cn(
                  'flex h-6 w-8 shrink-0 items-center justify-center rounded-full',
                  layout === 'list' && 'bg-neutral-100',
                )}
              >
                <List
                  size={15}
                  className={cn(layout !== 'list' && 'text-neutral-400')}
                />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-accent"
            >
              <Plus size={16} strokeWidth={2.2} className="text-neutral-600" />
              {t('New agent')}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-[151px] rounded-[19px]" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <AgentsEmptyState hasSearch={search.trim().length > 0} />
        ) : (
          <div
            className={cn(
              'grid gap-6',
              layout === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                : 'grid-cols-1',
            )}
          >
            {agents.map((agent: AgentSummary) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                projectDotColor={
                  PROJECT_COLOR_PALETTE[
                    projectById.get(agent.projectId)?.icon.color ??
                      project.icon.color
                  ]?.color
                }
                onClick={() =>
                  navigate(`/projects/${agent.projectId}/agents/${agent.id}`)
                }
              />
            ))}
          </div>
        )}
      </section>

      <CreateAgentDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
};

const AgentsEmptyState = ({ hasSearch }: { hasSearch: boolean }) => (
  <div className="flex flex-col items-start gap-1 rounded-lg border border-dashed border-border px-6 py-10">
    <p className="text-sm font-medium">
      {hasSearch ? t('No agents match that search') : t('No agents yet')}
    </p>
    <p className="text-sm text-muted-foreground">
      {hasSearch
        ? t('Try another name, or clear the search.')
        : t('Describe one above, or pick a template.')}
    </p>
  </div>
);

type AgentSort = keyof typeof SORT_LABELS;

export { AgentsPage };
