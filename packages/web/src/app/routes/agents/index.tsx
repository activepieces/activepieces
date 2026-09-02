import {
  AgentIcon,
  AgentListSort,
  AgentSummary,
  ColorName,
  MAX_DRAFT_PROMPT_LENGTH,
  PROJECT_COLOR_PALETTE,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  ArrowUp,
  ChevronsUpDown,
  LayoutGrid,
  List,
  Pencil,
  Search,
  SearchX,
  Settings2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';

import { LockedFeatureGuard } from '@/app/components/locked-feature-guard';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/custom/empty';
import { SearchableSelect } from '@/components/custom/searchable-select';
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
import { AgentTrioMark } from '@/features/agents/agent-mark';
import {
  agentsMutations,
  agentsQueries,
  useAgentsAvailable,
} from '@/features/agents/hooks/agents-hooks';
import { createAgentUtils } from '@/features/agents/lib/create-agent-utils';
import { aiProviderQueries } from '@/features/platform-admin/hooks/ai-provider-hooks';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

import {
  acceptsDraftPrompt,
  showsAgentList,
  shownDestination,
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
      locked={!agentsAvailable}
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
  const [sort, setSort] = useState<AgentListSort>(AgentListSort.UPDATED);
  const [prompt, setPrompt] = useState('');
  const [viewProjectId, setViewProjectId] = useState<string>(ALL_PROJECTS);
  const [pickedProjectId, setPickedProjectId] = useState<string | null>(null);
  const [buildingInProjectId, setBuildingInProjectId] = useState<string | null>(
    null,
  );
  const navigate = useNavigate();
  const { project } = projectCollectionUtils.useCurrentProject();
  const { data: allProjects } = projectCollectionUtils.useAll();
  const agentsAvailable = useAgentsAvailable();
  const isPlatformAdmin = useIsPlatformAdmin();
  const projectFiltered = viewProjectId !== ALL_PROJECTS;
  const createInProjectId =
    pickedProjectId ?? (projectFiltered ? viewProjectId : project.id);
  const [debouncedSearch] = useDebounce(search.trim(), 300);
  const {
    data,
    isLoading,
    isSuccess,
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

  const draftAgent = agentsMutations.useDraftAgent();
  const createAgent = agentsMutations.useCreateAgent({
    onSuccess: (agent) =>
      navigate(`/projects/${agent.projectId}/agents/${agent.id}`),
    onError: () => undefined,
  });
  const {
    data: chatProvider,
    isLoading: isLoadingProvider,
    isError: providerLookupFailed,
  } = aiProviderQueries.useChatProvider(createInProjectId);
  const { data: projectProviders } =
    aiProviderQueries.useProjectAiProviders(createInProjectId);
  const needsProvider =
    !isLoadingProvider && !providerLookupFailed && chatProvider === undefined;
  const chatIsOffOnEveryProvider =
    needsProvider && (projectProviders?.length ?? 0) > 0;
  const isBuilding = draftAgent.isPending || createAgent.isPending;
  const destinationReadinessUnknown = isLoadingProvider;
  const buildError = draftAgent.error ?? createAgent.error ?? null;

  const shownDestinationId = shownDestination({
    isBuilding,
    buildingIn: buildingInProjectId,
    picked: createInProjectId,
  });

  const projectOptions = useMemo(
    () =>
      (allProjects ?? []).map((entry) => ({
        value: entry.id,
        label: getProjectName(entry),
      })),
    [allProjects],
  );

  const buildAgent = (text?: string) => {
    const trimmed = (text ?? prompt).trim();
    if (
      !acceptsDraftPrompt({
        prompt: trimmed,
        isBuilding,
        readinessUnknown: destinationReadinessUnknown,
      })
    ) {
      return;
    }
    setPrompt(trimmed);
    const destination = createInProjectId;
    setBuildingInProjectId(destination);
    draftAgent.mutate(
      { projectId: destination, prompt: trimmed },
      {
        onSuccess: (draft) =>
          createAgent.mutate(
            createAgentUtils.buildCreateRequest({
              draft,
              projectId: destination,
            }),
          ),
      },
    );
  };

  const createBlankAgent = () => {
    if (createAgent.isPending) {
      return;
    }
    createAgent.mutate(
      createAgentUtils.buildCreateRequest({
        draft: {
          displayName: t('New agent'),
          description: '',
          icon: AgentIcon.BOT,
          color: ColorName.PURPLE,
          instructions: '',
        },
        projectId: createInProjectId,
      }),
    );
  };

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

  return (
    <div className="flex min-h-full w-full flex-col">
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
          {isBuilding
            ? t('Building your agent')
            : chatIsOffOnEveryProvider
            ? t('No provider is turned on for chat')
            : needsProvider
            ? t('Agents need an AI provider')
            : firstRun
            ? t('Create your first agent')
            : t('What should your agent do?')}
        </h1>
        <p
          className={cn(
            'text-[15px] leading-[18px] text-muted-foreground',
            firstRun && 'max-w-[468px] text-center text-base leading-6',
          )}
        >
          {chatIsOffOnEveryProvider
            ? t(
                'Your project has a provider, but writing an agent for you needs one turned on for chat.',
              )
            : needsProvider
            ? t('Add a provider once, then I can build agents from a sentence.')
            : isBuilding
            ? t('Picking the tools and writing its instructions')
            : firstRun
            ? t(
                'Your most reliable teammate for getting work done, powered by your tools and guided by your words.',
              )
            : t(
                "An agent is an assistant with instructions and tools. Describe the job and I'll write both.",
              )}
        </p>
        {needsProvider &&
          (isPlatformAdmin ? (
            <Button
              className="mt-4 gap-2"
              onClick={() => navigate('/platform/setup/ai')}
            >
              <Settings2 size={16} />
              {chatIsOffOnEveryProvider
                ? t('Turn on a provider for chat')
                : t('Connect an AI provider')}
            </Button>
          ) : (
            <p className="mt-4 text-[13px] leading-4 text-muted-foreground">
              {chatIsOffOnEveryProvider
                ? t('Ask your platform admin to turn on a provider for chat.')
                : t('Ask your platform admin to connect an AI provider.')}
            </p>
          ))}
        {chatIsOffOnEveryProvider && (
          <Button
            variant="outline"
            className="mt-4 gap-2"
            loading={createAgent.isPending}
            onClick={createBlankAgent}
          >
            <Pencil size={16} />
            {t('Write one by hand instead')}
          </Button>
        )}
        <div
          className={cn(
            'mt-4 flex min-h-14 w-full max-w-[680px] items-end gap-3.5 rounded-[28px] border bg-muted ps-5 pe-2 py-2 transition-colors',
            isBuilding ? 'border-primary/40' : 'border-border',
            needsProvider && 'hidden',
            firstRun &&
              'relative mt-6 max-w-[632px] flex-col items-stretch gap-4 rounded-xl bg-background px-[18px] pb-[14px] pt-[18px] shadow-[0_2px_12px_rgba(0,0,0,0.06)]',
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
              loading={isBuilding || destinationReadinessUnknown}
              onClick={() => buildAgent()}
              className={cn(
                'size-10 shrink-0 rounded-full',
                firstRun && 'size-9',
              )}
            >
              <ArrowUp size={16} strokeWidth={2.2} />
            </Button>
          </div>
        </div>
        {!needsProvider && (allProjects ?? []).length > 1 && (
          <div className="mt-[10px] flex items-center gap-1.5 text-[13px] leading-4 text-muted-foreground">
            <span>{t('New agents go to')}</span>
            <SearchableSelect
              value={shownDestinationId}
              onChange={(value) => setPickedProjectId(value)}
              options={projectOptions}
              disabled={isBuilding}
              placeholder={t('Search projects')}
              contentWidth="260px"
              triggerClassName="h-7 w-auto max-w-[220px] gap-1 border-0 bg-transparent px-1.5 text-[13px] font-medium shadow-none hover:bg-accent"
            />
          </div>
        )}
        {buildError !== null && (
          <p className="max-w-[680px] text-center text-[13px] leading-4 text-destructive">
            {api.extractServerErrorMessage(
              buildError,
              t("That didn't work. Try describing the agent another way."),
            )}
          </p>
        )}
        {!needsProvider && (
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
                      disabled={isBuilding || destinationReadinessUnknown}
                      onClick={() => buildAgent(t(starter.prompt))}
                      className="flex items-center gap-2 rounded-full border border-border py-[9px] pe-4 ps-[14px] text-sm font-medium leading-4 text-neutral-700 transition-colors hover:bg-accent disabled:opacity-50"
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
                      disabled={isBuilding || destinationReadinessUnknown}
                      onClick={() => buildAgent(t(suggestion))}
                      className="rounded-full border border-border px-3 py-[5px] text-[13px] leading-4 transition-colors hover:bg-accent disabled:opacity-50"
                    >
                      {t(suggestion)}
                    </button>
                  ))}
            </div>
          </div>
        )}
      </section>

      {showsAgentList({
        listLoading: isLoading,
        hasList: data !== undefined,
        firstRun,
      }) && (
        <section className="flex w-full flex-col gap-5 px-12 pt-11 pb-12">
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
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} className="h-[151px] rounded-[19px]" />
              ))}
            </div>
          ) : agents.length === 0 ? (
            showsNoMatchNotice({
              matchCount: agents.length,
              search,
              projectFiltered,
            }) ? (
              <AgentsEmptyState
                narrowedByProject={search.trim().length === 0}
              />
            ) : null
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
}: {
  narrowedByProject: boolean;
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
          ? t('Describe one above, or pick another project.')
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
