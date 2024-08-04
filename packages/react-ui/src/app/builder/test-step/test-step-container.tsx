import React from 'react';

import { ActionType, TriggerType } from '@activepieces/shared';

import { TestActionSection } from './test-action-section';
import { TestTriggerSection } from './test-trigger-section';

type TestStepContainerProps = {
  flowVersionId: string;
  isSaving: boolean;
  flowId: string;
  type: ActionType | TriggerType;
};

const TestStepContainer = React.memo(
  ({ flowVersionId, isSaving, type, flowId }: TestStepContainerProps) => {
    return (
      <>
        {type === TriggerType.PIECE ? (
          <TestTriggerSection
            flowId={flowId}
            isSaving={isSaving}
            flowVersionId={flowVersionId}
          ></TestTriggerSection>
        ) : (
          <TestActionSection
            flowVersionId={flowVersionId}
            isSaving={isSaving}
          ></TestActionSection>
        )}
      </>
    );
  },
);
TestStepContainer.displayName = 'TestStepContainer';

export { TestStepContainer };
