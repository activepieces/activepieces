// import { t } from 'i18next';
// import { Timer } from 'lucide-react';
// import React from 'react';

// import { JsonViewer } from '@/components/json-viewer';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { StepStatusIcon } from '@/features/flow-runs/components/step-status-icon';
// import { formatUtils } from '@/lib/utils';
// import { FlowAction, FlowActionType, flowStructureUtil, StepOutput } from '@activepieces/shared';
// import { FlowStepAgent } from './flow-step-agent';

// type FlowStepInputOutputProps = {
//   stepDetails: StepOutput;
//   selectedStep: FlowAction;
// };

// const tryParseJson = (value: unknown): unknown => {
//   if (typeof value !== 'string') return value;

//   try {
//     return JSON.parse(value);
//   } catch {
//     return value;
//   }
// };

// const getStepOutput = (stepDetails: StepOutput): unknown => {
//   return stepDetails.errorMessage
//     ? tryParseJson(stepDetails.errorMessage)
//     : stepDetails.output;
// };

// const FlowStepInputOutput = React.memo(
//   ({ stepDetails, selectedStep }: FlowStepInputOutputProps) => {
//     const stepOutput = getStepOutput(stepDetails);
//     const outputExists =
//       'output' in stepDetails || 'errorMessage' in stepDetails;
//     const isAgentStep =
//       selectedStep.type === FlowActionType.PIECE &&
//       flowStructureUtil.isAgentPiece(selectedStep);

//     return (
//       <ScrollArea className="h-full p-4">
//         <div className="flex flex-col gap-4">
//           <div className="flex items-center leading-4 gap-2 justify-start">
//             <StepStatusIcon status={stepDetails.status} size="5" />
//             <div>{selectedStep?.displayName}</div>
//           </div>
//           <div className="flex items-center gap-2 leading-4 justify-start">
//             <Timer className="w-5 h-5" />
//             <div>
//               {t('Duration')}:{' '}
//               {formatUtils.formatDuration(stepDetails.duration ?? 0, false)}
//             </div>
//           </div>
//           <JsonViewer title={t('Input')} json={stepDetails.input} />
//           {outputExists && (isAgentStep ? <FlowStepAgent stepDetails={stepDetails} selectedStep={selectedStep} />  : <JsonViewer title={t('Output')} json={stepOutput} />)}
//         </div>
//       </ScrollArea>
//     );
//   },
// );

// FlowStepInputOutput.displayName = 'FlowStepInputOutput';
// export { FlowStepInputOutput };

import { t } from 'i18next';
import { Timer } from 'lucide-react';
import React from 'react';

import { JsonViewer } from '@/components/json-viewer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { StepStatusIcon } from '@/features/flow-runs/components/step-status-icon';
import { formatUtils } from '@/lib/utils';
import {
  FlowAction,
  FlowActionType,
  flowStructureUtil,
  PieceAction,
  StepOutput,
  StepOutputStatus,
} from '@activepieces/shared';

import { FlowStepAgent } from './flow-step-agent';

type FlowStepInputOutputProps = {
  stepDetails: StepOutput;
  selectedStep: FlowAction;
};

const tryParseJson = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const getStepOutput = (stepDetails: StepOutput): unknown => {
  return stepDetails.errorMessage
    ? tryParseJson(stepDetails.errorMessage)
    : stepDetails.output;
};

const isAgentStep = (step: FlowAction): boolean => {
  return (
    step.type === FlowActionType.PIECE && flowStructureUtil.isAgentPiece(step)
  );
};

const hasOutput = (stepDetails: StepOutput): boolean => {
  return 'output' in stepDetails || 'errorMessage' in stepDetails;
};

const isStepRunning = (status: StepOutputStatus): boolean => {
  return (
    status === StepOutputStatus.RUNNING || status === StepOutputStatus.PAUSED
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-20 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

const FlowStepInputOutput = React.memo(
  ({ stepDetails, selectedStep }: FlowStepInputOutputProps) => {
    const stepOutput = getStepOutput(stepDetails);
    const outputExists = hasOutput(stepDetails);
    const isAgent = isAgentStep(selectedStep);
    const isRunning = isStepRunning(stepDetails.status);

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

          {isRunning ? (
            <LoadingSkeleton />
          ) : (
            outputExists &&
            (isAgent ? (
              <FlowStepAgent
                stepDetails={stepDetails}
                selectedStep={selectedStep as PieceAction}
              />
            ) : (
              <JsonViewer title={t('Output')} json={stepOutput} />
            ))
          )}
        </div>
      </ScrollArea>
    );
  },
);

FlowStepInputOutput.displayName = 'FlowStepInputOutput';

export { FlowStepInputOutput };
