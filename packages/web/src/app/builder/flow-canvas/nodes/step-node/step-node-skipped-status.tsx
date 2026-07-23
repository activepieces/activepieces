import { isNil } from '@activepieces/core-utils';
import {
  FlowTriggerType,
  FlowVersionState,
  flowStructureUtil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { RouteOff } from 'lucide-react';

import { flowRunUtils } from '@/features/flow-runs';

import { useBuilderStateContext } from '../../../builder-hooks';

import { StepNodeBadgeContainer } from './step-node-badge-container';

const ApStepNodeSkippedStatus = ({
  stepName,
  isSkipped,
}: {
  stepName: string;
  isSkipped: boolean;
}) => {
  const [run, stepType, isInDraft] = useBuilderStateContext((state) => [
    state.run,
    flowStructureUtil.getStep(stepName, state.flowVersion.trigger)?.type,
    state.flowVersion.state === FlowVersionState.DRAFT,
  ]);

  const hasRun = !isNil(run);
  const shouldShowSkippedStatus =
    isSkipped && (isInDraft || hasRun) && stepType !== FlowTriggerType.EMPTY;

  if (!shouldShowSkippedStatus) {
    return null;
  }

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
};

ApStepNodeSkippedStatus.displayName = 'ApStepNodeSkippedStatus';
export { ApStepNodeSkippedStatus };
