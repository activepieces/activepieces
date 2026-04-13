import { t } from 'i18next';
import { useMemo } from 'react';

import { StepStatusIcon, flowRunUtils } from '@/features/flow-runs';

import { useBuilderStateContext } from '../../../builder-hooks';
import { flowCanvasUtils } from '../../utils/flow-canvas-utils';

const ApStepNodeStatusInRun = ({ stepName }: { stepName: string }) => {
  const [run, loopIndexes] = useBuilderStateContext((state) => [
    state.run,
    state.loopsIndexes,
  ]);
  const stepStatusInRun = useMemo(() => {
    return flowCanvasUtils.getStepStatus(stepName, run, loopIndexes);
  }, [stepName, run, loopIndexes]);
  if (!stepStatusInRun) {
    return null;
  }
  const { variant, text } = stepStatusInRun
    ? flowRunUtils.getStatusIconForStep(stepStatusInRun)
    : ({ variant: 'default', text: t('Testing...') } as const);
  return (
    <div className="absolute right-[1px]  h-[20px] -top-[28px]">
      <div className={flowRunUtils.getStatusContainerClassName(variant, true)}>
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
ApStepNodeStatusInRun.displayName = 'ApStepNodeStatus';

export { ApStepNodeStatusInRun };
