import { t } from 'i18next';
import { useMemo } from 'react';

import { LoadingSpinner } from '@/components/ui/spinner';
import { StepStatusIcon } from '@/features/flow-runs/components/step-status-icon';
import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../../../builder-hooks';
import { flowCanvasUtils } from '../../utils/flow-canvas-utils';

const ApStepNodeStatus = ({ stepName }: { stepName: string }) => {
  const [run, loopIndexes, flowVersion, isBeingTested] = useBuilderStateContext(
    (state) => [
      state.run,
      state.loopsIndexes,
      state.flowVersion,
      state.isStepBeingTested(stepName),
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
  if (!stepStatusInRun && !isBeingTested) {
    return null;
  }
  const { variant, text } = stepStatusInRun
    ? flowRunUtils.getStatusIconForStep(stepStatusInRun)
    : ({ variant: 'default', text: t('Testing...') } as const);
  return (
    <div className="absolute right-[1px]  h-[20px] -top-[28px]">
      <div
        className={cn(
          'flex gap-1 animate-in fade-in slide-in-from-bottom-2 duration-500 items-center  justify-center px-2 py-1',
          flowRunUtils.getStatusContainerClassName(variant),
        )}
      >
        {isBeingTested && (
          <LoadingSpinner className="w-3 h-3 "></LoadingSpinner>
        )}
        {!isBeingTested && stepStatusInRun && (
          <StepStatusIcon
            status={stepStatusInRun}
            size="3"
            hideTooltip={true}
          ></StepStatusIcon>
        )}
        <div>{text}</div>
      </div>
    </div>
  );
};
ApStepNodeStatus.displayName = 'ApStepNodeStatus';

export { ApStepNodeStatus };
