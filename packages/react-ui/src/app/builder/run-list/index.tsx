import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
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
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { authenticationSession } from '@/lib/authentication-session';
import { FlowRun, SeekPage } from '@activepieces/shared';

import { SidebarHeader } from '../sidebar-header';

import { FLOW_CARD_HEIGHT, FlowRunCard } from './flow-run-card';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import { Button } from '@/components/ui/button';


const RunsList = React.memo( ()=> {
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
    isFetchingNextPage
  } = useInfiniteQuery<SeekPage<FlowRun>, Error, InfiniteData<SeekPage<FlowRun>>>({
    queryKey: ['flow-runs', flow.id],
    getNextPageParam: (lastPage) => lastPage.next,
    initialPageParam: undefined,
    queryFn: ({ pageParam }) =>
      flowRunsApi.list({
        flowId: [flow.id],
        projectId: authenticationSession.getProjectId()!,
        limit: 20,
        cursor: pageParam as string | undefined,
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
        {(isLoading ) &&
           <CardListItemSkeleton numberOfCards={10} />}

        {isError && <div>{t('Error, please try again.')}</div>}

        {runs &&
          runs.pages.flatMap((page) => page.data).length === 0 &&
          !isLoading &&
          !isRefetching && <CardListEmpty message={t('No runs found')} />}
{
            hasNextPage && <Button onClick={() => fetchNextPage()} loading={isFetchingNextPage}>Load more</Button>
          }
        {
          runs && runs.pages.flatMap((page) => page.data).length > 0 && (
            <>
             <VirtualizedScrollArea
            className="w-full h-full"
            items={runs.pages.flatMap((page) => page.data)}
            estimateSize={() => FLOW_CARD_HEIGHT}
            getItemKey={(index) => runs.pages.flatMap((page) => page.data)[index].id}
            renderItem={(item) =>
              <FlowRunCard
              refetchRuns={() => {
                refetch();
              }}
              run={item}
              key={item.id + item.status}
              viewedRunId={run?.id}
            ></FlowRunCard>
            }
          >
          </VirtualizedScrollArea>
          

            </>
          )
        }
      </CardList>
    </>
  );
});

RunsList.displayName = 'RunsList';
export { RunsList };
