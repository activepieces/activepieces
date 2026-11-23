import { isNil } from '@activepieces/core-utils';
import { FlowActionType, FlowTriggerType } from '@activepieces/shared';

import { batchUtils } from '@/app/builder/run-details/batch-utils';
import { useStepOutputInRun } from '@/app/builder/run-details/use-step-output-in-run';
import { StepStatusIcon, flowRunUtils } from '@/features/flow-runs';

import { useBuilderStateContext } from '../../../builder-hooks';

import { StepNodeBadgeContainer } from './step-node-badge-container';
import { SkippedBadge } from './step-node-skipped-status';

const ApStepNodeStatusInRun = ({
  stepName,
  stepType,
}: {
  stepName: string;
  stepType: FlowActionType | FlowTriggerType;
}) => {
  const run = useBuilderStateContext((state) => state.run);
  const { stepOutput } = useStepOutputInRun(stepName);
  const stepStatusInRun = isNil(run) ? undefined : stepOutput?.status;
  if (!stepStatusInRun) {
    return null;
  }
  if (
    batchUtils.isSkippedWithoutBatches({
      stepType,
      stepOutput: stepOutput?.output,
    })
  ) {
    return <SkippedBadge />;
  }
  const { text } = flowRunUtils.getStatusIconForStep(stepStatusInRun);
  return (
    <StepNodeBadgeContainer>
      <div
        className={flowRunUtils.getStatusContainerClassName({
          status: stepStatusInRun,
          withPaddingAndAnimation: true,
        })}
      >
        <StepStatusIcon
          status={stepStatusInRun}
          size="3"
          hideTooltip={true}
        ></StepStatusIcon>
        <div>{text}</div>
      </div>
    </StepNodeBadgeContainer>
  );
};
ApStepNodeStatusInRun.displayName = 'ApStepNodeStatus';

export { ApStepNodeStatusInRun };
