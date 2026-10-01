import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { useState } from 'react';

import { SidebarHeader } from '@/app/builder/sidebar-header';
import {
  CardListEmpty,
  CardListItem,
  CardListItemSkeleton,
} from '@/components/custom/card-list';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { FormattedDate } from '@/components/custom/formatted-date';
import { agentsQueries } from '@/features/agents/hooks/agents-hooks';
import { agentRunUtils } from '@/features/agents/lib/agent-run-utils';
import { projectCollectionUtils } from '@/features/projects';
import { cn } from '@/lib/utils';

import { RunDetailPanel } from './run-detail-panel';

export const AgentRuns = ({ agentId, onClose }: AgentRunsProps) => {
  const { project } = projectCollectionUtils.useCurrentProject();
  const [openRunId, setOpenRunId] = useState<string | null>(null);
  const {
    data: runs,
    isLoading,
    isError,
    refetch,
  } = agentsQueries.useAgentRuns({ agentId, projectId: project.id });
  const items = runs?.data ?? [];

  return (
    <div className="flex h-full w-full min-w-0 flex-col">
      <div className="flex h-[60px] shrink-0 items-center border-b border-border px-2">
        <SidebarHeader onClose={onClose}>{t('Recent Runs')}</SidebarHeader>
      </div>
      {isLoading && <CardListItemSkeleton numberOfCards={6} />}
      {isError && <DataFetchErrorState entity={t('runs')} onRetry={refetch} />}
      {!isLoading && !isError && items.length === 0 && (
        <CardListEmpty message={t('No flow has run this agent yet')} />
      )}
      {items.length > 0 && (
        <div className="min-h-0 grow overflow-y-auto">
          {items.map((run) => {
            const { Icon, variant } = agentRunUtils.getStatusIcon(run.status);
            return (
              <CardListItem
                key={run.id}
                className="px-3"
                selected={run.id === openRunId}
                onClick={() => setOpenRunId(run.id)}
              >
                <Icon
                  aria-label={agentRunUtils.getStatusLabel(run.status)}
                  className={cn('size-5 shrink-0', {
                    'text-success': variant === 'success',
                    'text-destructive': variant === 'error',
                  })}
                />
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-sm font-medium">
                    {run.title ?? t('Untitled run')}
                  </span>
                  <span className="flex min-w-0 gap-1 text-xs text-muted-foreground">
                    {!isNil(run.flow) && (
                      <span className="truncate">{run.flow.displayName} ·</span>
                    )}
                    <FormattedDate
                      date={new Date(run.created)}
                      includeTime={true}
                      className="shrink-0"
                    />
                  </span>
                </div>
              </CardListItem>
            );
          })}
        </div>
      )}
      <RunDetailPanel runId={openRunId} onClose={() => setOpenRunId(null)} />
    </div>
  );
};

type AgentRunsProps = {
  agentId: string;
  onClose: () => void;
};
