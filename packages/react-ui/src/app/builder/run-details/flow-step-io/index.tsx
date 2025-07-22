import React from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { stepUtils } from '@/features/pieces/lib/step-utils';
import {
  flowStructureUtil,
  StepOutput,
  Action,
  ActionType,
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
      ) as Action)
    : undefined;

  if (!selectedStep) {
    return null;
  }

  const isAgentStep =
    selectedStep.type === ActionType.PIECE &&
    stepUtils.isAgentPiece(selectedStep);
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
