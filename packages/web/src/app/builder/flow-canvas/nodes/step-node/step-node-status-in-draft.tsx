import { isNil } from '@activepieces/core-utils';
import {
  FlowTriggerType,
  FlowVersionState,
  StepOutputStatus,
  flowStructureUtil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { TriangleAlert } from 'lucide-react';
import React, { useMemo } from 'react';

import { InvalidStepIcon } from '@/components/custom/alert-icon';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { StepStatusIcon, flowRunUtils } from '@/features/flow-runs';
import { pieceSelectorUtils } from '@/features/pieces';
import { StepNodeBadgeStatus } from '@/lib/statuses';

import { useBuilderStateContext } from '../../../builder-hooks';

import { StepNodeBadgeContainer } from './step-node-badge-container';

const ApStepNodeStatusInDraft = ({ stepName }: { stepName: string }) => {
  const [
    run,
    isBeingTested,
    hasError,
    lastTestDate,
    lastUpdatedDate,
    stepType,
    isInDraft,
    isStepValid,
    isManualTrigger,
    isSkipped,
  ] = useBuilderStateContext((state) => {
    const step = flowStructureUtil.getStep(stepName, state.flowVersion.trigger);
    const isManualTrigger =
      step?.type === FlowTriggerType.PIECE &&
      pieceSelectorUtils.isManualTrigger({
        pieceName: step?.settings.pieceName,
        triggerName: step?.settings.triggerName ?? '',
      });
    return [
      state.run,
      state.isStepBeingTested(stepName),
      !isNil(state.errorLogs[stepName]),
      step?.settings?.sampleData?.lastTestDate as string | undefined,
      step?.lastUpdatedDate ?? '',
      step?.type,
      state.flowVersion.state === FlowVersionState.DRAFT,
      !!step?.valid,
      isManualTrigger,
      flowStructureUtil.isSkipped({
        stepName,
        trigger: state.flowVersion.trigger,
      }),
    ];
  });

  const draftStatusConfig: Record<
    DraftStepStatus,
    {
      text: string;
      icon: React.ReactNode;
    }
  > = {
    [StepNodeBadgeStatus.INVALID]: {
      text: t('Incomplete'),
      icon: <InvalidStepIcon className="size-3" />,
    },
    [StepNodeBadgeStatus.TESTING]: {
      text: t('Testing...'),
      icon: (
        <StepStatusIcon
          status={StepOutputStatus.RUNNING}
          size="3"
          hideTooltip={true}
        />
      ),
    },
    [StepNodeBadgeStatus.FAILED]: {
      text: t('Failed'),
      icon: (
        <StepStatusIcon
          status={StepOutputStatus.FAILED}
          size="3"
          hideTooltip={true}
        />
      ),
    },
    [StepNodeBadgeStatus.NEEDS_TEST]: {
      text: t('Test me'),
      icon: <TriangleAlert className="size-3" />,
    },
    [StepNodeBadgeStatus.UNTESTED]: {
      text: t('Test me'),
      icon: <TriangleAlert className="size-3" />,
    },
    [StepNodeBadgeStatus.TESTED]: {
      text: t('Tested'),
      icon: (
        <StepStatusIcon
          status={StepOutputStatus.SUCCEEDED}
          size="3"
          hideTooltip={true}
        />
      ),
    },
  };
  const status: DraftStepStatus = useMemo(() => {
    if (!isStepValid) return StepNodeBadgeStatus.INVALID;
    if (isBeingTested) return StepNodeBadgeStatus.TESTING;

    if (isNil(lastTestDate)) {
      return StepNodeBadgeStatus.UNTESTED;
    }
    if (lastUpdatedDate > lastTestDate) {
      return StepNodeBadgeStatus.NEEDS_TEST;
    }
    if (hasError) return StepNodeBadgeStatus.FAILED;

    return StepNodeBadgeStatus.TESTED;
  }, [isStepValid, isBeingTested, hasError, lastTestDate, lastUpdatedDate]);

  const hasRun = !isNil(run);
  const shouldShowDraftStatusBadge =
    isInDraft &&
    !hasRun &&
    stepType !== FlowTriggerType.EMPTY &&
    !isManualTrigger &&
    !isSkipped;

  if (!shouldShowDraftStatusBadge) {
    return null;
  }

  const config = draftStatusConfig[status];
  const badgeClassName = flowRunUtils.getStatusContainerClassName({
    status:
      status === StepNodeBadgeStatus.TESTING
        ? StepOutputStatus.RUNNING
        : status,
    withPaddingAndAnimation: true,
  });

  return (
    <StepNodeBadgeContainer>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={badgeClassName}>
            {config.icon}
            <div>{config.text}</div>
          </div>
        </TooltipTrigger>
        {status === StepNodeBadgeStatus.UNTESTED && (
          <TooltipContent>
            {t('This step has not been tested yet')}
          </TooltipContent>
        )}
        {status === StepNodeBadgeStatus.NEEDS_TEST && (
          <TooltipContent>
            {t('This step has been updated since the last test')}
          </TooltipContent>
        )}
      </Tooltip>
    </StepNodeBadgeContainer>
  );
};

ApStepNodeStatusInDraft.displayName = 'ApStepNodeStatusInDraft';
export { ApStepNodeStatusInDraft };

type DraftStepStatus = Exclude<
  StepNodeBadgeStatus,
  StepNodeBadgeStatus.SKIPPED
>;
