import { AgentSummary, PROJECT_COLOR_PALETTE } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowUp, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AgentCard } from '@/features/agents/agent-card';
import { agentsQueries } from '@/features/agents/hooks/agents-hooks';
import { projectCollectionUtils } from '@/features/projects';

const SUGGESTIONS = [
  'Triage support tickets',
  'Research a company',
  'Enrich a lead',
];

const AgentsPage = () => {
  const [search, setSearch] = useState('');
  const [prompt, setPrompt] = useState('');
  const { project } = projectCollectionUtils.useCurrentProject();
  const { data, isLoading } = agentsQueries.useAgents({});

  const agents = useMemo(() => {
    const all = data?.data ?? [];
    const needle = search.trim().toLowerCase();
    if (needle.length === 0) {
      return all;
    }
    return all.filter(
      (agent) =>
        agent.displayName.toLowerCase().includes(needle) ||
        (agent.description ?? '').toLowerCase().includes(needle),
    );
  }, [data, search]);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 pb-10">
      <section className="flex flex-col items-center gap-2 px-12 pt-8">
        <h1 className="text-2xl leading-[30px] tracking-[-0.01em]">
          {t('What should your agent do?')}
        </h1>
        <p className="text-[15px] leading-[18px] text-muted-foreground">
          {t(
            "Describe it in a sentence — I'll assemble the tools, model, and steps.",
          )}
        </p>
        <div className="mt-4 flex h-14 w-full max-w-[680px] items-center gap-3.5 rounded-full border border-border bg-muted ps-5 pe-2">
          <input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={t(
              'Draft weekly launch posts and file them in Notion...',
            )}
            className="h-10 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
          <Button size="icon" className="size-10 shrink-0 rounded-full">
            <ArrowUp size={18} />
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">{t('Try:')}</span>
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setPrompt(t(suggestion))}
              className="rounded-full border border-border px-3 py-[5px] text-sm transition-colors hover:bg-accent"
            >
              {t(suggestion)}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-[1104px] flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-xl font-semibold leading-6 tracking-[-0.01em]">
              {t('Your agents')}
            </h2>
            <span className="text-[15px] leading-[18px] text-muted-foreground">
              {agents.length}
            </span>
          </div>
          <div className="ms-auto flex items-center gap-3">
            <div className="flex h-8 w-[180px] shrink-0 items-center gap-2 rounded-full border border-border bg-muted px-3">
              <Search size={14} className="shrink-0 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('Search agents')}
                className="w-full bg-transparent text-[13px] leading-5 outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button
              type="button"
              className="flex h-8 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3.5 text-sm transition-colors hover:bg-accent"
            >
              <Plus size={16} />
              {t('New agent')}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-[137px] rounded-[19px]" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <AgentsEmptyState hasSearch={search.trim().length > 0} />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent: AgentSummary) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                projectName={
                  agent.projectId === project.id
                    ? project.displayName
                    : undefined
                }
                projectDotColor={
                  PROJECT_COLOR_PALETTE[project.icon.color]?.color
                }
                onClick={() => undefined}
              />
            ))}
          </div>
        )}
      </section>
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
        ? t('Try a different name, or clear the search.')
        : t('Describe what you need above, or start from one of the starters.')}
    </p>
  </div>
);

export { AgentsPage };
