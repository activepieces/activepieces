import { StepOutput } from '@activepieces/shared';
import { Timer } from 'lucide-react';
import React from 'react';

import { StepStatusIcon } from '../../../features/flow-runs/components/step-status-icon';

import {
  builderSelectors,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { JsonViewer } from '@/components/json-viewer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatUtils } from '@/lib/utils';

const FlowStepInputOutput = React.memo(
  ({ stepDetails }: { stepDetails: StepOutput | undefined }) => {
    const loopStepOut = stepDetails
      ? formatUtils.formatStepInputAndOutput(
          stepDetails.output,
          stepDetails.type,
        )
      : {};

    const flowVersion = useBuilderStateContext((state) => state.flowVersion);

    return (
      <ScrollArea className="h-full p-4 ">
        {stepDetails && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 justify-start mb-4">
              <StepStatusIcon
                status={stepDetails.status}
                size="5"
              ></StepStatusIcon>
              <div>{flowVersion.displayName}</div>
            </div>
            <div className="flex items-center gap-1 justify-start">
              <Timer className="w-5 h-5" />
              <span>
                Duration:{' '}
                {formatUtils.formatDuration(stepDetails.duration ?? 0, false)}
              </span>
            </div>
            <JsonViewer title="Input" json={stepDetails.input} />
            <div className="mt-4"></div>
            <JsonViewer title="Output" json={loopStepOut} />
          </div>
        )}
      </ScrollArea>
    );
  },
);

FlowStepInputOutput.displayName = 'FlowStepInputOutput';
export { FlowStepInputOutput };
