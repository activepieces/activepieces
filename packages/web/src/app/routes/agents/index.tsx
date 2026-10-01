import {
  AgentListSort,
  AgentSummary,
  PROJECT_COLOR_PALETTE,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  ArrowUp,
  ChevronsUpDown,
  LayoutGrid,
  List,
  Plus,
  SearchX,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';

import { LockedFeatureGuard } from '@/app/components/locked-feature-guard';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import {
  Page,
  PageHeader,
  PageSection,
  Toolbar,
  ToolbarSpacer,
} from '@/components/custom/page';
import { Panel } from '@/components/custom/panel';
import { SearchInput } from '@/components/custom/search-input';
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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AgentCard } from '@/features/agents/agent-card';
import { AgentTrioMark } from '@/features/agents/agent-mark';
import { AgentTable } from '@/features/agents/agent-table';
import {
  agentsMutations,
  agentsQueries,
  useAgentsAvailable,
} from '@/features/agents/hooks/agents-hooks';
import { blankAgentUtils } from '@/features/agents/lib/blank-agent';
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
    dot: 'bg-swatch-9-mark',
    prompt: 'Research a company and send me a cited brief on it',
  },
  {
    label: 'Support triage',
    dot: 'bg-swatch-6-mark',
    prompt: 'Read a support ticket, tag its severity, and route it to a team',
  },
  {
    label: 'Lead enrichment',
    dot: 'bg-swatch-11-mark',
    prompt: 'Enrich a new lead with company details and write the first email',
  },
  {
    label: 'SEO writer',
    dot: 'bg-swatch-3-mark',
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
    createAgent.mutate(blankAgentUtils.request({ projectId }));
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

  const composer = (
    <div className="flex w-full items-end gap-2 rounded-xl border border-gray-7 bg-panel py-1 pr-1 pl-3 shadow-xs focus-within:border-accent-8 focus-within:ring-3 focus-within:ring-accent-8/50">
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
        className="min-h-9 resize-none border-0 bg-transparent px-0 py-2 shadow-none focus-visible:ring-0"
      />
      <Button size="icon" onClick={() => askChat()} aria-label={t('Send')}>
        <ArrowUp />
      </Button>
    </div>
  );

  return (
    <Page>
      <PageHeader
        title={t('Agents')}
        description={t('Build an agent once, then use it in any flow.')}
      >
        {!firstRun && (
          <NewBlankAgentButton
            projects={allProjects ?? []}
            pending={createAgent.isPending}
            onCreate={createBlankAgent}
            variant="default"
            icon={<Plus />}
            label={t('New agent')}
          />
        )}
      </PageHeader>

      {firstRun && (
        <Empty className="border">
          <EmptyHeader className="max-w-xl">
            <AgentTrioMark className="mb-4" />
            <EmptyTitle>{t('Create your first agent')}</EmptyTitle>
            <EmptyDescription>
              {t(
                'An agent follows instructions you write and does the work using the apps you have connected.',
              )}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="max-w-xl">
            {chatEnabled ? (
              <>
                {composer}
                <span className="text-xs font-medium text-gray-11">
                  {t('Popular starting points')}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {TEMPLATE_STARTERS.map((starter) => (
                    <Button
                      key={starter.label}
                      variant="outline"
                      size="sm"
                      onClick={() => askChat(t(starter.prompt))}
                    >
                      <span
                        aria-hidden
                        className={cn('size-2 rounded-full', starter.dot)}
                      />
                      {t(starter.label)}
                    </Button>
                  ))}
                </div>
                <NewBlankAgentButton
                  projects={allProjects ?? []}
                  pending={createAgent.isPending}
                  onCreate={createBlankAgent}
                  variant="ghost"
                  icon={<Plus />}
                  label={t('Start from scratch')}
                />
              </>
            ) : (
              <NewBlankAgentButton
                projects={allProjects ?? []}
                pending={createAgent.isPending}
                onCreate={createBlankAgent}
                variant="default"
                icon={<Plus />}
                label={t('New agent')}
              />
            )}
          </EmptyContent>
        </Empty>
      )}

      {chatEnabled && !firstRun && (
        <Panel
          title={t('What should your agent do?')}
          description={t(
            "An agent is an assistant with instructions and tools. Describe the job and I'll write both.",
          )}
        >
          {composer}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-11">{t('Try:')}</span>
            {SUGGESTIONS.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="xs"
                onClick={() => askChat(t(suggestion))}
              >
                {t(suggestion)}
              </Button>
            ))}
          </div>
        </Panel>
      )}

      {showsAgentList({
        listLoading: isLoading,
        hasList: data !== undefined,
        firstRun,
      }) && (
        <PageSection
          title={
            <span className="flex items-baseline gap-2">
              {t('Your agents')}
              <span className="text-xs font-normal text-gray-11 tabular-nums">
                {agents.length}
              </span>
              {hasNextPage && (
                <span className="text-xs font-normal text-gray-11">
                  {t('Showing {count} so far', { count: agents.length })}
                </span>
              )}
            </span>
          }
        >
          <Toolbar>
            <div className="w-56">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('Search agents')}
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
                triggerClassName="w-44"
              />
            )}
            <ToolbarSpacer />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {t(SORT_LABELS[sort])}
                  <ChevronsUpDown className="text-gray-11" />
                </Button>
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
            <ToggleGroup
              type="single"
              variant="outline"
              value={layout}
              onValueChange={(value) => {
                if (value === 'grid' || value === 'list') {
                  setLayout(value);
                }
              }}
            >
              <ToggleGroupItem value="grid" aria-label={t('Grid view')}>
                <LayoutGrid />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label={t('List view')}>
                <List />
              </ToggleGroupItem>
            </ToggleGroup>
          </Toolbar>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-36 rounded-2xl" />
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
        </PageSection>
      )}
    </Page>
  );
};

const AgentsEmptyState = ({
  narrowedByProject,
  chatEnabled,
}: {
  narrowedByProject: boolean;
  chatEnabled: boolean;
}) => (
  <Empty className="min-h-60 border">
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
