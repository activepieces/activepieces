import { t } from 'i18next';
import { RouteOff } from 'lucide-react';
import { useMemo } from 'react';

import { InvalidStepIcon } from '@/components/custom/alert-icon';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { StepStatusIcon } from '@/features/flow-runs/components/step-status-icon';
import { flowStructureUtil, StepOutputStatus } from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasUtils } from '../utils/flow-canvas-utils';
import { flowUtilConsts } from '../utils/consts';
import { LoadingSpinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const ApStepNodeStatus = ({ stepName, isStepRounded }: { stepName: string, isStepRounded:boolean }) => {
  const [run, loopIndexes, flowVersion, step] = useBuilderStateContext(
    (state) => [
      state.run,
      state.loopsIndexes,
      state.flowVersion,
      flowStructureUtil.getStep(stepName, state.flowVersion.trigger),
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
  const isSkipped = flowCanvasUtils.isSkipped(stepName, flowVersion.trigger);

  if(stepStatusInRun === StepOutputStatus.RUNNING) {
    return <div className={cn("flex items-center justify-center absolute top-0 left-0 bg-background/50 backdrop-blur-sm rounded-md",{
      'rounded-full':isStepRounded
    })} style={{
      height: `${flowUtilConsts.AP_NODE_SIZE.STEP.height-5}px`,
      width: `${flowUtilConsts.AP_NODE_SIZE.STEP.width-5}px`,
      left: `-${flowUtilConsts.AP_NODE_SIZE.STEP.width-9}px`,
      top: `-${flowUtilConsts.AP_NODE_SIZE.STEP.height-9}px`,
    }}>
      <LoadingSpinner className="size-4"></LoadingSpinner>
    </div>
  }
  return (
    <div className="size-4 flex mt-0.5 items-center justify-center h-[20px]">
      {stepStatusInRun && (
        <StepStatusIcon
          status={stepStatusInRun}
          size="4"
          runStatus={run?.status}
        ></StepStatusIcon>
      )}
      {isSkipped && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center  size-4 bg-slate-50 text-slate-500 rounded-full">
              <RouteOff className="size-3"> </RouteOff>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('Skipped')}</TooltipContent>
        </Tooltip>
      )}
      {!step?.valid && !isSkipped && (
        <Tooltip>
          <TooltipTrigger asChild>
            <InvalidStepIcon
              size={20}
              viewBox="0 0 16 15"
              className="stroke-0 animate-fade drop-shadow-lg"
            ></InvalidStepIcon>
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
