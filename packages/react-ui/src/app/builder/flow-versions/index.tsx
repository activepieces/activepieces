import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

import {
  LeftSideBarType,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { CardList, CardListItemSkeleton } from '@/components/custom/card-list';
import { ScrollArea } from '@/components/ui/scroll-area';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { FlowVersionMetadata, SeekPage } from '@activepieces/shared';

import { SidebarHeader } from '../sidebar-header';

import { FlowVersionDetailsCard } from './flow-versions-card';

const FlowVersionsList = () => {
  const [flow, setLeftSidebar, selectedFlowVersion] = useBuilderStateContext(
    (state) => [state.flow, state.setLeftSidebar, state.flowVersion],
  );

  const {
    data: flowVersionPage,
    isLoading,
    isError,
  } = useQuery<SeekPage<FlowVersionMetadata>, Error>({
    queryKey: ['flow-versions', flow.id],
    queryFn: () =>
      flowsApi.listVersions(flow.id, {
        limit: 1000,
        cursor: undefined,
      }),
    staleTime: 0,
  });

  return (
    <>
      <SidebarHeader onClose={() => setLeftSidebar(LeftSideBarType.NONE)}>
        {t('Version History')}
      </SidebarHeader>
      <CardList>
        {isLoading && <CardListItemSkeleton numberOfCards={10} />}
        {isError && <div>{t('Error, please try again.')}</div>}
        {flowVersionPage && flowVersionPage.data && (
          <ScrollArea className="w-full h-full">
            {flowVersionPage.data.map((flowVersion, index) => (
              <FlowVersionDetailsCard
                selected={flowVersion.id === selectedFlowVersion?.id}
                publishedVersionId={flow.publishedVersionId}
                flowVersion={flowVersion}
                flowVersionNumber={flowVersionPage.data.length - index}
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
