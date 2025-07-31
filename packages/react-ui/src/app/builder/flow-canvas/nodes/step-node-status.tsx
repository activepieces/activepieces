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
import { flowStructureUtil } from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasUtils } from '../utils/flow-canvas-utils';

const ApStepNodeStatus = ({ stepName }: { stepName: string }) => {
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

  return (
    <div className="w-4 flex mt-0.5 items-center justify-center h-[20px]">
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
            <RouteOff className="w-4 h-4"> </RouteOff>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('Skipped')}</TooltipContent>
        </Tooltip>
      )}
      {!step?.valid && !isSkipped && (
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
