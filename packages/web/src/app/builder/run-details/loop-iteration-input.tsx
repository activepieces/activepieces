import { isNil } from '@activepieces/core-utils';
import {
  FlowActionType,
  StepOutput,
  StepOutputStatus,
  flowStructureUtil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { useMemo } from 'react';

import { useBuilderStateContext } from '../builder-hooks';

import { IterationRail } from './iteration-rail';
import { iterationRailUtils, RailDotStatus } from './iteration-rail-utils';
import { useStepOutputInRun } from './use-batch-logs';

const LoopIterationInput = ({ stepName }: { stepName: string }) => {
  const [setLoopIndex, currentIndex, run, stepType] = useBuilderStateContext(
    (state) => [
      state.setLoopIndex,
      state.loopsIndexes[stepName] ?? 0,
      state.run,
      flowStructureUtil.getStep(stepName, state.flowVersion.trigger)?.type,
    ],
  );
  const { stepOutput } = useStepOutputInRun(stepName);

  const iterationStatuses = useMemo<RailDotStatus[]>(() => {
    if (
      !stepOutput ||
      stepOutput.type !== FlowActionType.LOOP_ON_ITEMS ||
      !stepOutput.output
    ) {
      return [];
    }
    return stepOutput.output.iterations
      .map(getIterationStatus)
      .map(iterationRailUtils.fromStepOutputStatus);
  }, [stepOutput]);
  const totalIterations = iterationStatuses.length;

  if (isNil(run) || stepType !== FlowActionType.LOOP_ON_ITEMS) {
    return <></>;
  }

  return (
    <IterationRail
      total={totalIterations}
      current={currentIndex}
      statuses={iterationStatuses}
      onSelect={(index) => setLoopIndex(stepName, index)}
      inputTooltip={t(
        'Show child steps output on round ({iteration}/{totalIterations})',
        { iteration: currentIndex + 1, totalIterations },
      )}
      itemLabel={(index) => t('Iteration {index}', { index: index + 1 })}
    />
  );
};

LoopIterationInput.displayName = 'LoopIterationInput';

function getIterationStatus(
  iteration: Record<string, StepOutput>,
): StepOutputStatus {
  const statuses = Object.values(iteration).map(
    (stepOutput) => stepOutput.status,
  );
  if (statuses.includes(StepOutputStatus.FAILED)) {
    return StepOutputStatus.FAILED;
  }
  if (statuses.includes(StepOutputStatus.RUNNING)) {
    return StepOutputStatus.RUNNING;
  }
  if (statuses.includes(StepOutputStatus.PAUSED)) {
    return StepOutputStatus.PAUSED;
  }
  return StepOutputStatus.SUCCEEDED;
}

export { LoopIterationInput };
