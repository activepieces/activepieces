import { useQuery } from '@tanstack/react-query';
import React from 'react';

import {
  CardList,
  CardListEmpty,
  CardListItemSkeleton,
} from '@/components/ui/card-list';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { LeftSideBarType, useBuilderStateContext } from '@/hooks/builder-hooks';
import { FlowRun, SeekPage } from '@activepieces/shared';

import { SidebarHeader } from '../sidebar-header';

import { FlowRunCard } from './flow-run-card';

type FlowRunsListProps = {
  recentRuns?: number;
};

const FlowRecentRunsList = React.memo(
  ({ recentRuns = 20 }: FlowRunsListProps) => {
    const { flow, setLeftSidebar } = useBuilderStateContext((state) => state);

    const {
      data: flowPage,
      isLoading,
      isError,
    } = useQuery<SeekPage<FlowRun>, Error>({
      queryKey: ['flow-runs', flow.id],
      queryFn: () =>
        flowRunsApi.list({
          flowId: flow.id,
          limit: recentRuns,
          cursor: undefined,
        }),
      staleTime: 15 * 1000,
    });

    return (
      <>
        <SidebarHeader onClose={() => setLeftSidebar(LeftSideBarType.NONE)}>
          Recent Runs
        </SidebarHeader>
        <CardList>
          {isLoading && <CardListItemSkeleton numberOfCards={10} />}
          {isError && <div>Error, please try again.</div>}
          {flowPage && flowPage.data.length === 0 && (
            <CardListEmpty message="No runs found" />
          )}

          <ScrollArea className="w-full h-full">
            {flowPage &&
              flowPage.data.map((flowRun: FlowRun) => (
                <FlowRunCard run={flowRun} key={flowRun.id}></FlowRunCard>
              ))}
            <ScrollBar />
          </ScrollArea>
        </CardList>
      </>
    );
  },
);

FlowRecentRunsList.displayName = 'FlowRecentRunsList';
export { FlowRecentRunsList };
