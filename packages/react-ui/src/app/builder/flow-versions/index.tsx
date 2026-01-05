import { t } from 'i18next';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { CardList, CardListItemSkeleton } from '@/components/custom/card-list';
import { ScrollArea } from '@/components/ui/scroll-area';
import { flowHooks } from '@/features/flows/lib/flow-hooks';
import { RightSideBarType } from '@/lib/types';

import { SidebarHeader } from '../sidebar-header';

import { FlowVersionDetailsCard } from './flow-versions-card';

const FlowVersionsList = () => {
  const [flow, setRightSidebar, selectedFlowVersion] = useBuilderStateContext(
    (state) => [state.flow, state.setRightSidebar, state.flowVersion],
  );

  const {
    data: flowVersionPage,
    isLoading,
    isError,
  } = flowHooks.useListFlowVersions(flow.id);

  return (
    <>
      <SidebarHeader onClose={() => setRightSidebar(RightSideBarType.NONE)}>
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
