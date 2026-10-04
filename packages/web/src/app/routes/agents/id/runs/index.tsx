import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { History } from 'lucide-react';
import { useState } from 'react';

import { SidebarHeader } from '@/app/builder/sidebar-header';
import {
  CardListItem,
  CardListItemSkeleton,
} from '@/components/custom/card-list';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { FormattedDate } from '@/components/custom/formatted-date';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
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
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = agentsQueries.useAgentRuns({ agentId, projectId: project.id });
  const items = runs?.pages.flatMap((page) => page.data) ?? [];
  const showList = !isLoading && !isError && items.length > 0;

  return (
    <div className="flex h-full w-full min-w-0 flex-col">
      <div className="flex h-[60px] shrink-0 items-center border-b border-gray-6 px-2">
        <SidebarHeader onClose={onClose}>{t('Recent Runs')}</SidebarHeader>
      </div>
      {isLoading && <CardListItemSkeleton numberOfCards={6} />}
      {isError && <DataFetchErrorState entity={t('runs')} onRetry={refetch} />}
      {!isLoading && !isError && items.length === 0 && (
        <Empty className="h-full">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <History />
            </EmptyMedia>
            <EmptyTitle>{t('No flow has run this agent yet')}</EmptyTitle>
            <EmptyDescription>
              {t(
                'Add a Run Agent step to a flow and pick this agent. Every run it makes on its own shows up here.',
              )}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {showList && (
        <div className="min-h-0 grow overflow-y-auto">
          {items.map((run) => {
            const { Icon, variant } = agentRunUtils.getStatusIcon(run.status);
            return (
              <CardListItem
                key={run.id}
                className="p-0"
                selected={run.id === openRunId}
              >
                <button
                  type="button"
                  className="flex w-full min-w-0 items-center gap-3 px-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-8"
                  onClick={() => setOpenRunId(run.id)}
                >
                  <Icon
                    aria-label={agentRunUtils.getStatusLabel(run.status)}
                    className={cn('size-5 shrink-0', {
                      'text-success-11': variant === 'success',
                      'text-danger-11': variant === 'error',
                    })}
                  />
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-sm font-medium">
                      {run.title ?? t('Untitled run')}
                    </span>
                    <span className="flex min-w-0 gap-1 text-xs text-gray-11">
                      {!isNil(run.flow) && (
                        <span className="truncate">
                          {run.flow.displayName} ·
                        </span>
                      )}
                      <FormattedDate
                        date={new Date(run.created)}
                        includeTime={true}
                        className="shrink-0"
                      />
                    </span>
                  </div>
                </button>
              </CardListItem>
            );
          })}
          {hasNextPage && (
            <div className="px-3 py-2">
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => fetchNextPage()}
                loading={isFetchingNextPage}
              >
                {t('More...')}
              </Button>
            </div>
          )}
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
