import { useMemo } from 'react';

import { StepStatusIcon } from '@/features/flow-runs/components/step-status-icon';
import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../../../builder-hooks';
import { flowCanvasUtils } from '../../utils/flow-canvas-utils';

const ApStepNodeStatus = ({ stepName }: { stepName: string }) => {
  const [run, loopIndexes, flowVersion] = useBuilderStateContext((state) => [
    state.run,
    state.loopsIndexes,
    state.flowVersion,
  ]);
  const stepStatusInRun = useMemo(() => {
    return flowCanvasUtils.getStepStatus(
      stepName,
      run,
      loopIndexes,
      flowVersion,
    );
  }, [stepName, run, loopIndexes, flowVersion]);
  if (!stepStatusInRun) {
    return null;
  }
  const { variant, text } = flowRunUtils.getStatusIconForStep(stepStatusInRun);
  return (
    <div className="absolute right-[1px]  h-[20px] -top-[28px]">
      <div
        className={cn(
          'flex gap-1 animate-in fade-in slide-in-from-bottom-2 duration-500 items-center  justify-center px-2 py-1',
          flowRunUtils.getStatusContainerClassName(variant),
        )}
      >
        <StepStatusIcon
          status={stepStatusInRun}
          size="3"
          hideTooltip={true}
        ></StepStatusIcon>
        <div>{text}</div>
      </div>
    </div>
  );
};
ApStepNodeStatus.displayName = 'ApStepNodeStatus';

export { ApStepNodeStatus };
