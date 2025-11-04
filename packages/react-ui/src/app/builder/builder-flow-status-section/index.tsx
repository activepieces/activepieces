import React from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { FlowStatusToggle } from '@/features/flows/components/flow-status-toggle';
import { FlowVersionStateDot } from '@/features/flows/components/flow-version-state-dot';
import { FlowVersionState } from '@activepieces/shared';

import { PublishButton } from './publish-button';
import { EditFlowOrViewDraftButton } from './view-draft-or-edit-flow-button';
const BuilderFlowStatusSection = React.memo(() => {
  const [flowVersion, flow] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.flow,
  ]);

  return (
    <>
      <div className="flex items-center space-x-2">
        <FlowVersionStateDot
          state={flowVersion.state}
          versionId={flowVersion.id}
          publishedVersionId={flow.publishedVersionId}
        ></FlowVersionStateDot>
        {(flow.publishedVersionId === flowVersion.id ||
          flowVersion.state === FlowVersionState.DRAFT) && (
          <FlowStatusToggle flow={flow}></FlowStatusToggle>
        )}
      </div>
      <EditFlowOrViewDraftButton />
      <PublishButton />
    </>
  );
});

BuilderFlowStatusSection.displayName = 'BuilderFlowStatusSection';
export { BuilderFlowStatusSection };
