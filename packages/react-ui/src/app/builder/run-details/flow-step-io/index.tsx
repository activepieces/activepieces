import React from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import {
  flowStructureUtil,
  StepOutput,
  FlowAction,
  FlowActionType,
} from '@activepieces/shared';

import { FlowStepAgent } from './flow-step-agent';
import { FlowStepInputOutput } from './flow-step-input-output';

type FlowStepIOProps = {
  stepDetails: StepOutput;
};

const FlowStepIO = React.memo(({ stepDetails }: FlowStepIOProps) => {
  const [flowVersion, selectedStepName] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.selectedStep,
  ]);

  const selectedStep = selectedStepName
    ? (flowStructureUtil.getStep(
        selectedStepName,
        flowVersion.trigger,
      ) as FlowAction)
    : undefined;

  if (!selectedStep) {
    return null;
  }

  const isAgentStep =
    selectedStep.type === FlowActionType.PIECE &&
    flowStructureUtil.isAgentPiece(selectedStep);
  if (isAgentStep) {
    return (
      <FlowStepAgent stepDetails={stepDetails} selectedStep={selectedStep} />
    );
  }

  return (
    <FlowStepInputOutput
      stepDetails={stepDetails}
      selectedStep={selectedStep}
    />
  );
});

FlowStepIO.displayName = 'FlowStepIO';

export { FlowStepIO };
