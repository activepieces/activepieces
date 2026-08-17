import { AgentSummary } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowUp, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <div className="flex w-full flex-col gap-10 px-6 py-10">
      <section className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">
            {t('What should your agent do?')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "Describe it in a sentence — I'll assemble the tools, model, and steps.",
            )}
          </p>
        </div>
        <div className="flex w-full max-w-[680px] items-center gap-2 rounded-full border border-border bg-muted/40 py-1.5 ps-5 pe-1.5">
          <Input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={t(
              'Draft weekly launch posts and file them in Notion...',
            )}
            className="h-9 border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
          <Button size="icon" className="size-9 shrink-0 rounded-full">
            <ArrowUp size={16} />
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">{t('Try:')}</span>
          {SUGGESTIONS.map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              onClick={() => setPrompt(t(suggestion))}
            >
              {t(suggestion)}
            </Button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold tracking-[-0.015em]">
            {t('Your agents')}
          </h2>
          <span className="text-sm text-muted-foreground">{agents.length}</span>
          <div className="ms-auto flex items-center gap-2">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('Search agents')}
                thin
                className="w-[220px] ps-8"
              />
            </div>
            <Button variant="outline" size="sm">
              <Plus size={16} />
              {t('New agent')}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-[132px] rounded-lg" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <AgentsEmptyState hasSearch={search.trim().length > 0} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent: AgentSummary) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                projectName={
                  agent.projectId === project.id
                    ? project.displayName
                    : undefined
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
