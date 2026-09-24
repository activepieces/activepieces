import {
  AgentIcon,
  AgentListSort,
  AgentSummary,
  ColorName,
  DEFAULT_AGENT_MAX_STEPS,
  PROJECT_COLOR_PALETTE,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  ArrowUp,
  ChevronsUpDown,
  LayoutGrid,
  List,
  Plus,
  Search,
  SearchX,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';

import { LockedFeatureGuard } from '@/app/components/locked-feature-guard';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { AgentCard } from '@/features/agents/agent-card';
import { AgentTrioMark } from '@/features/agents/agent-mark';
import { AgentTable } from '@/features/agents/agent-table';
import {
  agentsMutations,
  agentsQueries,
  useAgentsAvailable,
} from '@/features/agents/hooks/agents-hooks';
import { NewBlankAgentButton } from '@/features/agents/new-blank-agent-button';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { CHAT_ROUTE } from '@/lib/route-utils';
import { cn } from '@/lib/utils';

import {
  showsAgentList,
  showsFirstRun,
  showsNoMatchNotice,
} from './lib/agents-list-state';

const SUGGESTIONS = [
  'Triage support tickets',
  'Research a company',
  'Enrich a lead',
];

const TEMPLATE_STARTERS: TemplateStarter[] = [
  {
    label: 'Research analyst',
    dot: '#0D9488',
    prompt: 'Research a company and send me a cited brief on it',
  },
  {
    label: 'Support triage',
    dot: '#D97706',
    prompt: 'Read a support ticket, tag its severity, and route it to a team',
  },
  {
    label: 'Lead enrichment',
    dot: '#2563EB',
    prompt: 'Enrich a new lead with company details and write the first email',
  },
  {
    label: 'SEO writer',
    dot: '#E11D48',
    prompt: 'Research keywords for a topic and draft a post that targets them',
  },
];

const SORT_LABELS: Record<AgentListSort, string> = {
  [AgentListSort.UPDATED]: 'Recently updated',
  [AgentListSort.CREATED]: 'Recently created',
  [AgentListSort.NAME]: 'Name',
};

const ALL_PROJECTS = 'all';

const AgentsPage = () => {
  const agentsAvailable = useAgentsAvailable();
  return (
    <LockedFeatureGuard
      featureKey="AGENTS"
      locked={!agentsAvailable}
      lockTitle={t('Unlock Agents')}
      lockDescription={t('Build an agent once, then use it in any flow.')}
    >
      <AgentsPageContent />
    </LockedFeatureGuard>
  );
};

const AgentsPageContent = () => {
  const [search, setSearch] = useState('');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [sort, setSort] = useState<AgentListSort>(AgentListSort.UPDATED);
  const [prompt, setPrompt] = useState('');
  const [viewProjectId, setViewProjectId] = useState<string>(ALL_PROJECTS);
  const navigate = useNavigate();
  const { project } = projectCollectionUtils.useCurrentProject();
  const { data: allProjects } = projectCollectionUtils.useAll();
  const { platform } = platformHooks.useCurrentPlatform();
  const agentsAvailable = useAgentsAvailable();
  const chatEnabled = platform.plan.chatEnabled;
  const projectFiltered = viewProjectId !== ALL_PROJECTS;
  const [debouncedSearch] = useDebounce(search.trim(), 300);
  const {
    data,
    isLoading,
    isSuccess,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = agentsQueries.useAgents({
    ...(projectFiltered ? { projectId: viewProjectId } : {}),
    ...(debouncedSearch.length > 0 ? { search: debouncedSearch } : {}),
    sort,
    enabled: agentsAvailable,
  });

  const agents = useMemo(
    () => (data?.pages ?? []).flatMap((page) => page.data),
    [data],
  );

  const createAgent = agentsMutations.useCreateAgent({
    onSuccess: (agent) =>
      navigate(`/projects/${agent.projectId}/agents/${agent.id}`),
    onError: () => undefined,
  });

  const projectOptions = useMemo(
    () =>
      (allProjects ?? []).map((entry) => ({
        value: entry.id,
        label: getProjectName(entry),
      })),
    [allProjects],
  );

  const askChat = (text?: string) => {
    const trimmed = (text ?? prompt).trim();
    if (trimmed.length === 0) {
      return;
    }
    if (projectFiltered && viewProjectId !== project.id) {
      projectCollectionUtils.setCurrentProject(viewProjectId);
    }
    navigate(CHAT_ROUTE, {
      state: {
        prompt: t('Build me an agent for this: {task}', { task: trimmed }),
      },
    });
  };

  const createBlankAgent = (projectId: string) => {
    if (createAgent.isPending) {
      return;
    }
    createAgent.mutate({
      projectId,
      displayName: t('New agent'),
      description: null,
      icon: AgentIcon.BOT,
      color: ColorName.PURPLE,
      draft: {
        instructions: '',
        maxSteps: DEFAULT_AGENT_MAX_STEPS,
        tools: [],
        structuredOutput: [],
      },
    });
  };

  const projectDotColorFor = (agent: AgentSummary) =>
    PROJECT_COLOR_PALETTE[
      projectById.get(agent.projectId)?.icon.color ?? project.icon.color
    ]?.color;

  const openAgent = (agent: AgentSummary) =>
    navigate(`/projects/${agent.projectId}/agents/${agent.id}`);

  const projectById = useMemo(
    () => new Map((allProjects ?? []).map((entry) => [entry.id, entry])),
    [allProjects],
  );

  const firstRun = showsFirstRun({
    listLoaded: isSuccess,
    hasAnyAgents: agents.length > 0,
    search,
    projectFiltered,
  });

  const showsHero = chatEnabled || firstRun;

  return (
    <div className="flex min-h-full w-full flex-col">
      {showsHero && (
        <section
          className={cn(
            'flex flex-col items-center gap-2 px-12 pt-8',
            firstRun &&
              'relative flex-1 justify-center gap-3 overflow-hidden py-16',
          )}
        >
          {firstRun && (
            <>
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[520px] -translate-x-1/2 -translate-y-[230px]"
                style={{
                  backgroundImage:
                    'radial-gradient(ellipse at center, hsl(var(--primary) / 0.1) 0%, hsl(var(--primary) / 0) 70%)',
                }}
              />
              <AgentTrioMark className="mb-[22px]" />
            </>
          )}
          <h1
            className={cn(
              'text-2xl leading-[30px] tracking-[-0.01em]',
              firstRun &&
                'text-[32px] font-bold leading-[38px] tracking-[-0.02em]',
            )}
          >
            {firstRun
              ? t('Create your first agent')
              : t('What should your agent do?')}
          </h1>
          <p
            className={cn(
              'text-[15px] leading-[18px] text-muted-foreground',
              firstRun && 'max-w-[468px] text-center text-base leading-6',
            )}
          >
            {firstRun
              ? t(
                  'An agent follows instructions you write and does the work using the apps you have connected.',
                )
              : t(
                  "An agent is an assistant with instructions and tools. Describe the job and I'll write both.",
                )}
          </p>
          {!chatEnabled ? (
            <NewBlankAgentButton
              projects={allProjects ?? []}
              pending={createAgent.isPending}
              onCreate={createBlankAgent}
              variant="default"
              className="mt-6 gap-2"
              icon={<Plus size={16} />}
              label={t('New agent')}
            />
          ) : (
            <>
              <div
                className={cn(
                  'mt-4 flex min-h-14 w-full max-w-[680px] items-end gap-3.5 rounded-[28px] border border-border bg-muted ps-5 pe-2 py-2 transition-colors',
                  firstRun &&
                    'relative mt-6 max-w-[632px] flex-col items-stretch gap-4 rounded-xl bg-background px-[18px] pb-[14px] pt-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.06)]',
                )}
              >
                <Textarea
                  value={prompt}
                  minRows={1}
                  maxRows={8}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      askChat();
                    }
                  }}
                  placeholder={
                    firstRun
                      ? t(
                          'Describe a task for your agent… e.g. research our competitors and send me a weekly brief',
                        )
                      : t('Draft weekly launch posts and file them in Notion…')
                  }
                  className={cn(
                    'min-h-10 resize-none border-0 bg-transparent px-0 py-2.5 text-base leading-5 shadow-none focus-visible:ring-0 placeholder:text-neutral-400',
                    firstRun && 'min-h-11 px-1 py-1 text-[15px] leading-[22px]',
                  )}
                />
                <div className={cn(firstRun && 'flex justify-end')}>
                  <Button
                    size="icon"
                    onClick={() => askChat()}
                    className={cn(
                      'size-10 shrink-0 rounded-full',
                      firstRun && 'size-9',
                    )}
                  >
                    <ArrowUp size={16} strokeWidth={2.2} />
                  </Button>
                </div>
              </div>
              <div
                className={cn(
                  'mt-[14px] flex flex-wrap items-center justify-center gap-2',
                  firstRun && 'mt-[22px] flex-col gap-[14px]',
                )}
              >
                <span
                  className={cn(
                    'text-[13px] leading-4 text-muted-foreground',
                    firstRun && 'font-medium',
                  )}
                >
                  {firstRun ? t('Popular starting points') : t('Try:')}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-[10px]">
                  {firstRun
                    ? TEMPLATE_STARTERS.map((starter) => (
                        <button
                          key={starter.label}
                          type="button"
                          onClick={() => askChat(t(starter.prompt))}
                          className="flex items-center gap-2 rounded-full border border-border py-[9px] pe-4 ps-[14px] text-sm font-medium leading-4 text-neutral-700 transition-colors hover:bg-accent"
                        >
                          <span
                            aria-hidden
                            className="size-[11px] shrink-0 rounded-sm"
                            style={{ backgroundColor: starter.dot }}
                          />
                          {t(starter.label)}
                        </button>
                      ))
                    : SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => askChat(t(suggestion))}
                          className="rounded-full border border-border px-3 py-[5px] text-[13px] leading-4 transition-colors hover:bg-accent"
                        >
                          {t(suggestion)}
                        </button>
                      ))}
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {showsAgentList({
        listLoading: isLoading,
        hasList: data !== undefined,
        firstRun,
      }) && (
        <section
          className={cn(
            'flex w-full flex-col gap-5 px-12 pb-12 pt-11',
            !chatEnabled && 'pt-8',
          )}
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-xl font-semibold leading-6 tracking-[-0.01em]">
                {t('Your agents')}
              </h2>
              <span className="text-[15px] leading-[18px] text-muted-foreground">
                {agents.length}
              </span>
              {hasNextPage && (
                <span className="text-[13px] leading-4 text-muted-foreground">
                  {t('Showing {count} so far', { count: agents.length })}
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
              {(allProjects ?? []).length > 1 && (
                <SearchableSelect
                  value={viewProjectId}
                  onChange={(value) => setViewProjectId(value ?? ALL_PROJECTS)}
                  options={[
                    { value: ALL_PROJECTS, label: t('All projects') },
                    ...projectOptions,
                  ]}
                  placeholder={t('Search projects')}
                  triggerClassName="h-8 w-[170px] rounded-md text-[13px] font-normal"
                />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-8 items-center gap-2 rounded-md border border-border px-3 text-[13px] leading-4 transition-colors hover:bg-accent"
                  >
                    {t(SORT_LABELS[sort])}
                    <ChevronsUpDown
                      size={14}
                      className="text-muted-foreground"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup
                    value={sort}
                    onValueChange={(value) => setSort(value as AgentListSort)}
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
              <NewBlankAgentButton
                projects={allProjects ?? []}
                pending={createAgent.isPending}
                onCreate={createBlankAgent}
                size="sm"
                className="px-3.5 text-neutral-700"
                icon={<Plus size={15} />}
                label={t('New agent')}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-[151px] rounded-[19px]" />
              ))}
            </div>
          ) : isError ? (
            <DataFetchErrorState entity={t('agents')} onRetry={refetch} />
          ) : agents.length === 0 ? (
            showsNoMatchNotice({
              matchCount: agents.length,
              search,
              projectFiltered,
            }) ? (
              <AgentsEmptyState
                narrowedByProject={search.trim().length === 0}
                chatEnabled={chatEnabled}
              />
            ) : null
          ) : layout === 'list' ? (
            <AgentTable
              agents={agents}
              projectDotColorFor={projectDotColorFor}
              onOpen={openAgent}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {agents.map((agent: AgentSummary) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  projectDotColor={projectDotColorFor(agent)}
                  onClick={() => openAgent(agent)}
                />
              ))}
            </div>
          )}
          {hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                loading={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                {t('Load more')}
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

const AgentsEmptyState = ({
  narrowedByProject,
  chatEnabled,
}: {
  narrowedByProject: boolean;
  chatEnabled: boolean;
}) => (
  <Empty className="min-h-[240px]">
    <EmptyHeader className="max-w-xl">
      <EmptyMedia variant="icon">
        <SearchX />
      </EmptyMedia>
      <EmptyTitle>
        {narrowedByProject
          ? t('No agents in this project yet')
          : t('No agents match that search')}
      </EmptyTitle>
      <EmptyDescription>
        {narrowedByProject
          ? chatEnabled
            ? t('Describe one above, or pick another project.')
            : t('Add one with New agent, or pick another project.')
          : t('Try another name, or clear the search.')}
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
);

type TemplateStarter = {
  label: string;
  dot: string;
  prompt: string;
};

export { AgentsPage };
