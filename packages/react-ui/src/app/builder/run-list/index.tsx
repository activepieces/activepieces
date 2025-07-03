import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import React from 'react';

import {
  LeftSideBarType,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import {
  CardList,
  CardListEmpty,
  CardListItemSkeleton,
} from '@/components/custom/card-list';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { authenticationSession } from '@/lib/authentication-session';
import { FlowRun, SeekPage } from '@activepieces/shared';

import { SidebarHeader } from '../sidebar-header';

import { FlowRunCard } from './flow-run-card';

type FlowRunsListProps = {
  recentRuns?: number;
};

const RunsList = React.memo(({ recentRuns = 20 }: FlowRunsListProps) => {
  const [flow, setLeftSidebar, run] = useBuilderStateContext((state) => [
    state.flow,
    state.setLeftSidebar,
    state.run,
  ]);

  const {
    data: flowPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery<SeekPage<FlowRun>, Error>({
    queryKey: ['flow-runs', flow.id],
    queryFn: () =>
      flowRunsApi.list({
        flowId: [flow.id],
        projectId: authenticationSession.getProjectId()!,
        limit: recentRuns,
        cursor: undefined,
      }),
    refetchOnMount: true,
    staleTime: 15 * 1000,
  });

  return (
    <>
      <SidebarHeader onClose={() => setLeftSidebar(LeftSideBarType.NONE)}>
        {t('Recent Runs')}
      </SidebarHeader>
      <CardList>
        {isLoading ||
          (isRefetching && <CardListItemSkeleton numberOfCards={10} />)}
        {isError && <div>{t('Error, please try again.')}</div>}
        {flowPage && flowPage.data.length === 0 && (
          <CardListEmpty message={t('No runs found')} />
        )}

        <ScrollArea className="w-full h-full">
          {!isRefetching &&
            !isLoading &&
            flowPage &&
            flowPage.data.map((flowRun: FlowRun) => (
              <FlowRunCard
                refetchRuns={() => {
                  refetch();
                }}
                run={flowRun}
                key={flowRun.id + flowRun.status}
                viewedRunId={run?.id}
              ></FlowRunCard>
            ))}
          <ScrollBar />
        </ScrollArea>
      </CardList>
    </>
  );
});

RunsList.displayName = 'RunsList';
export { RunsList };
