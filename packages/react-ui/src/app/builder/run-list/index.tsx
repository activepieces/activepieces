import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useMemo } from 'react';

import {
  LeftSideBarType,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import {
  CardListEmpty,
  CardListItemSkeleton,
} from '@/components/custom/card-list';
import { Button } from '@/components/ui/button';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  FlowRun,
  isFlowRunStateTerminal,
  SeekPage,
} from '@activepieces/shared';

import { SidebarHeader } from '../sidebar-header';

import { FLOW_CARD_HEIGHT, FlowRunCard } from './flow-run-card';

type RunsListItem =
  | { type: 'flowRun'; run: FlowRun }
  | { type: 'loadMoreButton'; id: 'loadMoreButton' };
const RunsList = React.memo(() => {
  const [flow, setLeftSidebar, run] = useBuilderStateContext((state) => [
    state.flow,
    state.setLeftSidebar,
    state.run,
  ]);

  const {
    data: runs,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<
    SeekPage<FlowRun>,
    Error,
    InfiniteData<SeekPage<FlowRun>>
  >({
    queryKey: ['flow-runs', flow.id],
    getNextPageParam: (lastPage) => lastPage.next,
    initialPageParam: undefined,
    queryFn: ({ pageParam }) =>
      flowRunsApi.list({
        flowId: [flow.id],
        projectId: authenticationSession.getProjectId()!,
        limit: 15,
        cursor: pageParam as string | undefined,
      }),
    refetchOnMount: true,
    staleTime: 0,
    refetchInterval: (query) => {
      const allRuns = query.state.data?.pages.flatMap((page) => page.data);
      const runningRuns = allRuns?.filter(
        (run) =>
          !isFlowRunStateTerminal({
            status: run.status,
            ignoreInternalError: false,
          }),
      );
      return runningRuns?.length ? 15 * 1000 : false;
    },
  });

  const allViewedRuns: RunsListItem[] = useMemo(() => {
    const allRuns = (runs?.pages.flatMap((page) => page.data) ?? []).map(
      (run) => ({ type: 'flowRun' as const, run }),
    );
    if (hasNextPage) {
      console.log('hasNextPage', hasNextPage);
      return [
        ...allRuns,
        { type: 'loadMoreButton' as const, id: 'loadMoreButton' },
      ];
    }
    return allRuns;
  }, [runs, hasNextPage]);

  return (
    <div className="h-full w-full flex flex-col">
      <SidebarHeader onClose={() => setLeftSidebar(LeftSideBarType.NONE)}>
        {t('Recent Runs')}
      </SidebarHeader>
      {isLoading && <CardListItemSkeleton numberOfCards={10} />}

      {isError && <div>{t('Error, please try again.')}</div>}

      {runs &&
        runs.pages.flatMap((page) => page.data).length === 0 &&
        !isLoading &&
        !isRefetching && <CardListEmpty message={t('No runs found')} />}

      {runs && runs.pages.flatMap((page) => page.data).length > 0 && (
        <VirtualizedScrollArea
          className="w-full grow max-w-[calc(100%-6px)]"
          items={allViewedRuns}
          estimateSize={() => FLOW_CARD_HEIGHT}
          getItemKey={(index) => index}
          renderItem={(item) => {
            if (item.type === 'flowRun') {
              return (
                <FlowRunCard
                  refetchRuns={() => {
                    refetch();
                  }}
                  run={item.run}
                  key={item.run.id + item.run.status}
                  viewedRunId={run?.id}
                ></FlowRunCard>
              );
            }
            return (
              <div className="mx-5 h-full flex items-center ">
                <Button
                  className="w-full"
                  variant={'accent'}
                  onClick={() => fetchNextPage()}
                  loading={isFetchingNextPage}
                >
                  {t('More...')}
                </Button>
              </div>
            );
          }}
        ></VirtualizedScrollArea>
      )}
    </div>
  );
});

RunsList.displayName = 'RunsList';
export { RunsList };
