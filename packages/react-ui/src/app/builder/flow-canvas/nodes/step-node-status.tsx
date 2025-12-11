import { useMemo } from 'react';
import { StepStatusIcon } from '@/features/flow-runs/components/step-status-icon';
import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasUtils } from '../utils/flow-canvas-utils';
import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import { cn } from '@/lib/utils';

const ApStepNodeStatus = ({ stepName }: { stepName: string }) => {
  const [run, loopIndexes, flowVersion] = useBuilderStateContext(
    (state) => [
      state.run,
      state.loopsIndexes,
      state.flowVersion,
    ],
  );
  const stepStatusInRun = useMemo(() => {
    return flowCanvasUtils.getStepStatus(
      stepName,
      run,
      loopIndexes,
      flowVersion,
    );
  }, [stepName, run, loopIndexes, flowVersion]);
  if(!stepStatusInRun) return null;
  const { variant, text } = flowRunUtils.getStatusIconForStep(stepStatusInRun);
  return (
    <div className={cn("flex gap-1 items-center justify-center px-2  rounded-md absolute right-[1px] text-sm h-[20px] -top-[25px]", {
      'hidden': !stepStatusInRun,
      'text-green-800 bg-green-100 border border-green-200': variant === 'success',
      'text-red-800 bg-red-100 border border-red-200': variant === 'error',
      'bg-background border border-border text-foreground': variant === 'default',
    })}>
        <StepStatusIcon
          status={stepStatusInRun}
          size="3"
          hideTooltip={true}
        ></StepStatusIcon>
      {text}
    </div>
  );
};
ApStepNodeStatus.displayName = 'ApStepNodeStatus';

export { ApStepNodeStatus };
