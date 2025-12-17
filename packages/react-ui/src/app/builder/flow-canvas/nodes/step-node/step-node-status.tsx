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
    <div className="absolute right-[1px] text-sm h-[20px] -top-[28px]">
      <div
        className={cn(
          'flex gap-1 animate-in fade-in slide-in-from-bottom-2 duration-500 items-center justify-center px-2  rounded-md ',
          {
            hidden: !stepStatusInRun,
            'text-green-800 bg-green-50 border border-green-200':
              variant === 'success',
            'text-red-800 bg-red-50 border border-red-200': variant === 'error',
            'bg-background border border-border text-foreground':
              variant === 'default',
          },
        )}
      >
        <StepStatusIcon
          status={stepStatusInRun}
          size="3"
          hideTooltip={true}
        ></StepStatusIcon>
        {text}
      </div>
    </div>
  );
};
ApStepNodeStatus.displayName = 'ApStepNodeStatus';

export { ApStepNodeStatus };
