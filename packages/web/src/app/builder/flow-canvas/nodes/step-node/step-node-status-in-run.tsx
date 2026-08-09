import { isNil } from '@activepieces/core-utils';
import { flowStructureUtil } from '@activepieces/shared';
import { t } from 'i18next';
import { RouteOff } from 'lucide-react';

import { batchRailUtils } from '@/app/builder/run-details/batch-rail-utils';
import { useStepOutputInRun } from '@/app/builder/run-details/use-batch-logs';
import { StepStatusIcon, flowRunUtils } from '@/features/flow-runs';

import { useBuilderStateContext } from '../../../builder-hooks';

import { StepNodeBadgeContainer } from './step-node-badge-container';

const ApStepNodeStatusInRun = ({ stepName }: { stepName: string }) => {
  const [run, stepType] = useBuilderStateContext((state) => [
    state.run,
    flowStructureUtil.getStep(stepName, state.flowVersion.trigger)?.type,
  ]);
  const { stepOutput } = useStepOutputInRun(stepName);
  const stepStatusInRun = isNil(run) ? undefined : stepOutput?.status;
  if (!stepStatusInRun) {
    return null;
  }
  if (
    batchRailUtils.isSkippedOnEmptyItems({
      stepType,
      stepOutput: stepOutput?.output,
    })
  ) {
    return (
      <StepNodeBadgeContainer>
        <div
          className={flowRunUtils.getStatusContainerClassName('default', true)}
        >
          <RouteOff className="size-3" />
          <div>{t('Skipped')}</div>
        </div>
      </StepNodeBadgeContainer>
    );
  }
  const { variant, text } = stepStatusInRun
    ? flowRunUtils.getStatusIconForStep(stepStatusInRun)
    : ({ variant: 'default', text: t('Testing...') } as const);
  return (
    <StepNodeBadgeContainer>
      <div className={flowRunUtils.getStatusContainerClassName(variant, true)}>
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
