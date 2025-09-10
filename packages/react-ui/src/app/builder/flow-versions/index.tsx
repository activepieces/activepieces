/* eslint-disable import/no-unresolved */
/* eslint-disable import/order */
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';

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
import { FlowVersionComparison } from './flow-version-comparison';

const FlowVersionsList = () => {
  const [flow, setLeftSidebar, selectedFlowVersion] = useBuilderStateContext(
    (state) => [state.flow, state.setLeftSidebar, state.flowVersion],
  );
  const [comparisonVersions, setComparisonVersions] = useState<{
    version1: FlowVersionMetadata;
    version2: FlowVersionMetadata;
  } | null>(null);

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

  const handleCompareVersion = (version: FlowVersionMetadata) => {
    if (!flowVersionPage?.data) return;

    // Find the previous version to compare with
    const currentIndex = flowVersionPage.data.findIndex(
      (v) => v.id === version.id,
    );
    const previousVersion = flowVersionPage.data[currentIndex + 1];
    if (previousVersion) {
      setComparisonVersions({
        version1: previousVersion,
        version2: version,
      });
    }
  };

  const handleBackToVersions = () => {
    setComparisonVersions(null);
  };

  if (comparisonVersions) {
    return (
      <FlowVersionComparison
        version1={comparisonVersions.version1}
        version2={comparisonVersions.version2}
        onBack={handleBackToVersions}
      />
    );
  }

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
                published={flow.publishedVersionId === flowVersion.id}
                flowVersion={flowVersion}
                flowVersionNumber={flowVersionPage.data.length - index}
                onCompare={handleCompareVersion}
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
