import { t } from 'i18next';
import { Timer } from 'lucide-react';
import React from 'react';

import { JsonViewer } from '@/components/json-viewer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StepStatusIcon } from '@/features/flow-runs/components/step-status-icon';
import { formatUtils } from '@/lib/utils';
import { Action, StepOutput } from '@activepieces/shared';

type FlowStepInputOutputProps = {
  stepDetails: StepOutput;
  selectedStep: Action;
};

const FlowStepInputOutput = React.memo(
  ({ stepDetails, selectedStep }: FlowStepInputOutputProps) => {
    const stepOutput = stepDetails.errorMessage ?? stepDetails.output;
    const outputExists =
      'output' in stepDetails || 'errorMessage' in stepDetails;
    return (
      <ScrollArea className="h-full p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center leading-4 gap-2 justify-start">
            <StepStatusIcon status={stepDetails.status} size="5" />
            <div>{selectedStep?.displayName}</div>
          </div>
          <div className="flex items-center gap-2 leading-4 justify-start">
            <Timer className="w-5 h-5" />
            <div>
              {t('Duration')}:{' '}
              {formatUtils.formatDuration(stepDetails.duration ?? 0, false)}
            </div>
          </div>
          <JsonViewer title={t('Input')} json={stepDetails.input} />
          {outputExists && <JsonViewer title={t('Output')} json={stepOutput} />}
        </div>
      </ScrollArea>
    );
  },
);

FlowStepInputOutput.displayName = 'FlowStepInputOutput';
export { FlowStepInputOutput };
