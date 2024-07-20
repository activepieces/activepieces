import React from 'react';

import { Button } from '@/components/ui/button';
import FlowStatusToggle from '@/features/flows/components/flow-status-toggle';
import { FlowVersionStateDot } from '@/features/flows/components/flow-version-state-dot';
import { PublishButtonStatus, useBuilderStateContext } from '@/hooks/builder-hooks';
import { FlowVersionState } from '@activepieces/shared';

const FlowStateToolbar = React.memo(() => {
  const flowVersion = useBuilderStateContext((state) => state.flowVersion);
  const flow = useBuilderStateContext((state) => state.flow);
  const isSaving = useBuilderStateContext((state) => state.publishButtonStatus === PublishButtonStatus.SAVING);

  return (
    <>
      {flow.publishedVersionId && (
        <div className="flex items-center space-x-2">
          <FlowVersionStateDot state={flowVersion.state}></FlowVersionStateDot>
          <FlowStatusToggle flow={flow}></FlowStatusToggle>
        </div>
      )}

      {flowVersion.state === FlowVersionState.DRAFT && (
        <Button size={'sm'} loading={isSaving}>Publish</Button>
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
