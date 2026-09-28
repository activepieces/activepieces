import { isNil } from '@activepieces/core-utils';
import {
  FlowTriggerType,
  FlowVersionState,
  flowStructureUtil,
} from '@activepieces/shared';
import { RouteBlockIcon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { flowRunUtils } from '@/features/flow-runs';

import { useBuilderStateContext } from '../../../builder-hooks';
import { flowCanvasUtils } from '../../utils/flow-canvas-utils';

import { StepNodeBadgeContainer } from './step-node-badge-container';

const ApStepNodeSkippedStatus = ({ stepName }: { stepName: string }) => {
  const [run, stepType, isInDraft, isSkipped] = useBuilderStateContext(
    (state) => [
      state.run,
      flowStructureUtil.getStep(stepName, state.flowVersion.trigger)?.type,
      state.flowVersion.state === FlowVersionState.DRAFT,
      flowCanvasUtils.isSkipped(stepName, state.flowVersion.trigger),
    ],
  );

  const hasRun = !isNil(run);
  const shouldShowSkippedStatus =
    isSkipped && (isInDraft || hasRun) && stepType !== FlowTriggerType.EMPTY;

  if (!shouldShowSkippedStatus) {
    return null;
  }

  return (
    <StepNodeBadgeContainer>
      <div
        className={flowRunUtils.getStatusContainerClassName({
          variant: 'default',
          withPaddingAndAnimation: true,
        })}
      >
        <HugeiconsIcon icon={RouteBlockIcon} className="size-3" />
        <div>{t('Skipped')}</div>
      </div>
    </StepNodeBadgeContainer>
  );
};

ApStepNodeSkippedStatus.displayName = 'ApStepNodeSkippedStatus';
export { ApStepNodeSkippedStatus };
