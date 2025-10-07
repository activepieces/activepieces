import React from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { FlowStatusToggle } from '@/features/flows/components/flow-status-toggle';
import { FlowVersionStateDot } from '@/features/flows/components/flow-version-state-dot';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { FlowVersionState, Permission } from '@activepieces/shared';

const BuilderFlowStatusSection = React.memo(() => {
  const { checkAccess } = useAuthorization();
  const userHasPermissionToUpdateFlowStatus = checkAccess(
    Permission.UPDATE_FLOW_STATUS,
  );
  const [flowVersion, flow, readonly] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.flow,
    state.readonly,
  ]);
  const showFlowStatusSection =
    (!readonly || flow.publishedVersionId === flowVersion.id) &&
    userHasPermissionToUpdateFlowStatus;
  return (
    <>
      {showFlowStatusSection && (
        <>
          {flow.publishedVersionId && (
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
          )}
        </>
      )}

    </>
  );
});

BuilderFlowStatusSection.displayName = 'BuilderFlowStatusSection';
export { BuilderFlowStatusSection };
