import { t } from 'i18next';
import { Timer } from 'lucide-react';
import React from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { JsonViewer } from '@/components/json-viewer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StepStatusIcon } from '@/features/flow-runs/components/step-status-icon';
import { formatUtils } from '@/lib/utils';
import { flowStructureUtil, StepOutput } from '@activepieces/shared';

const FlowStepInputOutput = React.memo(
  ({ stepDetails }: { stepDetails: StepOutput }) => {
    const stepOutput = stepDetails.errorMessage ?? stepDetails.output;

    const [flowVersion, selectedStepName] = useBuilderStateContext((state) => [
      state.flowVersion,
      state.selectedStep,
    ]);
    const selectedStep = selectedStepName
      ? flowStructureUtil.getStepOrThrow(selectedStepName, flowVersion.trigger)
      : undefined;
    return (
      <ScrollArea className="h-full p-4 ">
        {stepDetails && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center leading-4  gap-2 justify-start">
              <StepStatusIcon
                status={stepDetails.status}
                size="5"
              ></StepStatusIcon>
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
            <JsonViewer title={t('Output')} json={stepOutput} />
          </div>
        )}
      </ScrollArea>
    );
  },
);

FlowStepInputOutput.displayName = 'FlowStepInputOutput';
export { FlowStepInputOutput };
