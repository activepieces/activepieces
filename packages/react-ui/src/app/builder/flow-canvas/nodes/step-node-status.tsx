import { t } from 'i18next';
import { RouteOff } from 'lucide-react';
import { useMemo } from 'react';

import { InvalidStepIcon } from '@/components/custom/alert-icon';
import { LoadingSpinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { StepStatusIcon } from '@/features/flow-runs/components/step-status-icon';
import { FlowRunStatus, isNil, Step } from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasUtils } from '../utils/flow-canvas-utils';

const ApStepNodeStatus = ({ step }: { step: Step }) => {
  const [run, loopIndexes, flowVersion] = useBuilderStateContext((state) => [
    state.run,
    state.loopsIndexes,
    state.flowVersion,
  ]);

  const stepStatusInRun = useMemo(() => {
    return flowCanvasUtils.getStepStatus(
      step.name,
      run,
      loopIndexes,
      flowVersion,
    );
  }, [step.name, run, loopIndexes, flowVersion]);
  const isSkipped = flowCanvasUtils.isSkipped(step.name, flowVersion.trigger);
  const stillRunning =
    isNil(stepStatusInRun) &&
    run?.status === FlowRunStatus.RUNNING &&
    !isSkipped;

  return (
    <div className="w-4 flex mt-0.5 items-center justify-center h-[20px]">
      {stepStatusInRun && (
        <StepStatusIcon status={stepStatusInRun} size="4"></StepStatusIcon>
      )}
      {stillRunning && (
        <LoadingSpinner className="w-4 h-4 "></LoadingSpinner>
      )}
      {isSkipped && (
        <Tooltip>
          <TooltipTrigger asChild>
            <RouteOff className="w-4 h-4"> </RouteOff>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('Skipped')}</TooltipContent>
        </Tooltip>
      )}
      {!step.valid && !isSkipped && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="mr-3">
              <InvalidStepIcon
                size={16}
                viewBox="0 0 16 15"
                className="stroke-0 animate-fade"
              ></InvalidStepIcon>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {t('Incomplete settings')}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};
ApStepNodeStatus.displayName = 'ApStepNodeStatus';

export { ApStepNodeStatus };
