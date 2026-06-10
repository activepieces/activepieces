import { FlowActionType, FlowTriggerType } from '@activepieces/shared';
import React from 'react';

import { TestActionSection } from './test-action-section';
import { TestTriggerSection } from './test-trigger-section';

type TestStepContainerProps = {
  flowVersionId: string;
  isSaving: boolean;
  flowId: string;
  type: FlowActionType | FlowTriggerType;
  projectId: string;
};

const TestStepContainer = React.memo(
  ({
    flowVersionId,
    isSaving,
    type,
    flowId,
    projectId,
  }: TestStepContainerProps) => {
    return (
      <div className="flex flex-col h-full">
        {type === FlowTriggerType.PIECE ? (
          <TestTriggerSection
            flowId={flowId}
            isSaving={isSaving}
            flowVersionId={flowVersionId}
            projectId={projectId}
          ></TestTriggerSection>
        ) : (
          <TestActionSection
            flowVersionId={flowVersionId}
            isSaving={isSaving}
            projectId={projectId}
          ></TestActionSection>
        )}
      </div>
    );
  },
);
TestStepContainer.displayName = 'TestStepContainer';

export { TestStepContainer };
