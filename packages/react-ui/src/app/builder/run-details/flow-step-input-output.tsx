import { t } from 'i18next';
import { Timer } from 'lucide-react';
import React from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { JsonViewer } from '@/components/json-viewer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StepStatusIcon } from '@/features/flow-runs/components/step-status-icon';
import { formatUtils } from '@/lib/utils';
import { flowHelper, StepOutput } from '@activepieces/shared';

const FlowStepInputOutput = React.memo(
  ({ stepDetails }: { stepDetails: StepOutput | undefined }) => {
    const loopStepOut = stepDetails
      ? formatUtils.formatStepInputAndOutput(
          stepDetails.output,
          stepDetails.type,
        )
      : {};

    const [flowVersion, selectedStepName] = useBuilderStateContext((state) => [
      state.flowVersion,
      state.selectedStep,
    ]);
    const selectedStep = selectedStepName
      ? flowHelper.getStep(flowVersion, selectedStepName.stepName)
      : undefined;
    return (
      <ScrollArea className="h-full p-4 ">
        {stepDetails && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 justify-start mb-4">
              <StepStatusIcon
                status={stepDetails.status}
                size="5"
              ></StepStatusIcon>
              <div>{selectedStep?.displayName}</div>
            </div>
            <div className="flex items-center gap-1 justify-start">
              <Timer className="w-5 h-5" />
              <span>
                {t('Duration')}:{' '}
                {formatUtils.formatDuration(stepDetails.duration ?? 0, false)}
              </span>
            </div>
            <JsonViewer title={t('Input')} json={stepDetails.input} />
            <div className="mt-4"></div>
            <JsonViewer title={t('Output')} json={loopStepOut} />
          </div>
        )}
      </ScrollArea>
    );
  },
);

FlowStepInputOutput.displayName = 'FlowStepInputOutput';
export { FlowStepInputOutput };
