import { useQuery } from '@tanstack/react-query';

import { CardList, CardListItemSkeleton } from '@/components/ui/card-list';
import { ScrollArea } from '@/components/ui/scroll-area';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { LeftSideBarType, useBuilderStateContext } from '@/hooks/builder-hooks';
import { FlowVersionMetadata, SeekPage } from '@activepieces/shared';

import { SidebarHeader } from '../sidebar-header';

import { FlowVersionDetailsCard } from './flow-versions-card';

const FlowVersionsList = () => {
  const { flow, setLeftSidebar } = useBuilderStateContext((state) => state);
  const {
    data: flowVersionPage,
    isLoading,
    isError,
  } = useQuery<SeekPage<FlowVersionMetadata>, Error>({
    queryKey: ['flow-versions', flow.id],
    queryFn: () =>
      flowsApi.listVersions(flow.id, {
        limit: 100,
        cursor: undefined,
      }),
    staleTime: Infinity,
  });

  return (
    <>
      <SidebarHeader onClose={() => setLeftSidebar(LeftSideBarType.NONE)}>
        Versions
      </SidebarHeader>
      <CardList>
        {isLoading && <CardListItemSkeleton numberOfCards={10} />}
        {isError && <div>Error, please try again.</div>}
        {flowVersionPage && flowVersionPage.data && (
          <ScrollArea className="w-full h-full">
            {flowVersionPage.data.map((flowVersion, index) => (
              <FlowVersionDetailsCard
                flowVersion={flowVersion}
                index={index}
                key={flowVersion.id}
              />
            ))}
          </ScrollArea>
        )}
      </CardList>
    </>
  );
};

FlowVersionsList.displayName = 'FlowVersionsList';

export { FlowVersionsList };
