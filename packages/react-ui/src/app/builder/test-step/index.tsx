import { t } from 'i18next';
import React from 'react';

import { ActionType, TriggerType } from '@activepieces/shared';

import { TestActionSection } from './test-action-section';
import { TestTriggerSection } from './test-trigger-section';

type TestStepContainerProps = {
  flowVersionId: string;
  isSaving: boolean;
  flowId: string;
  type: ActionType | TriggerType;
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
      <div className="flex flex-col gap-4">
        <div className="text-md font-semibold ">
          {t('Generate Sample Data')}
        </div>
        {type === TriggerType.PIECE ? (
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
