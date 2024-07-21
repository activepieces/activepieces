import React from 'react';

import {
  PublishButtonStatus,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import FlowStatusToggle from '@/features/flows/components/flow-status-toggle';
import { FlowVersionStateDot } from '@/features/flows/components/flow-version-state-dot';
import { FlowVersionState } from '@activepieces/shared';

const FlowStateToolbar = React.memo(() => {
  const [flowVersion, flow, isSaving] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.flow,
    state.publishButtonStatus === PublishButtonStatus.LOADING,
  ]);
  return (
    <>
      {flow.publishedVersionId && (
        <div className="flex items-center space-x-2">
          <FlowVersionStateDot state={flowVersion.state}></FlowVersionStateDot>
          <FlowStatusToggle flow={flow}></FlowStatusToggle>
        </div>
      )}

      {flowVersion.state === FlowVersionState.DRAFT && (
        <Button size={'sm'} loading={isSaving}>
          Publish
        </Button>
      )}
      {flowVersion.state === FlowVersionState.LOCKED && (
        <Button size={'sm'} variant={'outline'}>
          Edit Flow
        </Button>
      )}
    </>
  );
});

FlowStateToolbar.displayName = 'FlowStateToolbar';
export { FlowStateToolbar };
