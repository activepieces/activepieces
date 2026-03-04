import {
  FlowTriggerType,
  FlowVersionState,
  StepOutputStatus,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { RouteOff, TriangleAlert } from 'lucide-react';
import React, { useMemo } from 'react';

import { InvalidStepIcon } from '@/components/custom/alert-icon';
import { StepStatusIcon, flowRunUtils } from '@/features/flow-runs';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../../../builder-hooks';
import { flowCanvasUtils } from '../../utils/flow-canvas-utils';

type DraftStepStatus =
  | 'skipped'
  | 'invalid'
  | 'testing'
  | 'failed'
  | 'needs-test'
  | 'tested';

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
    isSkipped,
  ] = useBuilderStateContext((state) => {
    const step = flowStructureUtil.getStep(stepName, state.flowVersion.trigger);
    return [
      state.run,
      state.isStepBeingTested(stepName),
      !isNil(state.errorLogs[stepName]),
      step?.settings?.sampleData?.lastTestDate as string | undefined,
      step?.lastUpdatedDate ?? '',
      step?.type,
      state.flowVersion.state === FlowVersionState.DRAFT,
      !!step?.valid,
      flowCanvasUtils.isSkipped(stepName, state.flowVersion.trigger),
    ];
  });

  const status: DraftStepStatus = useMemo(() => {
    if (isSkipped) return 'skipped';
    if (!isStepValid) return 'invalid';
    if (isBeingTested) return 'testing';

    if (isNil(lastTestDate) || lastUpdatedDate > lastTestDate) {
      return 'needs-test';
    }
    if (hasError) return 'failed';

    return 'tested';
  }, [
    isSkipped,
    isStepValid,
    isBeingTested,
    hasError,
    lastTestDate,
    lastUpdatedDate,
  ]);

  if (!isNil(run) || stepType === FlowTriggerType.EMPTY || !isInDraft) {
    return null;
  }

  const config = draftStatusConfig[status];

  return (
    <div className="absolute right-[1px] h-[20px] -top-[28px]">
      <div
        className={cn(
          'flex gap-1 animate-in fade-in slide-in-from-bottom-2 duration-500 items-center justify-center px-2 py-1',
          flowRunUtils.getStatusContainerClassName(config.variant),
        )}
      >
        {config.icon}
        <div>{config.text}</div>
      </div>
    </div>
  );
};

const draftStatusConfig: Record<
  DraftStepStatus,
  {
    variant: 'default' | 'success' | 'error' | 'warning';
    text: string;
    icon: React.ReactNode;
  }
> = {
  skipped: {
    variant: 'default',
    text: t('Skipped'),
    icon: <RouteOff className="size-3" />,
  },
  invalid: {
    variant: 'warning',
    text: t('Incomplete'),
    icon: <InvalidStepIcon className="size-3" />,
  },
  testing: {
    variant: 'default',
    text: t('Testing...'),
    icon: (
      <StepStatusIcon
        status={StepOutputStatus.RUNNING}
        size="3"
        hideTooltip={true}
      />
    ),
  },
  failed: {
    variant: 'error',
    text: t('Failed'),
    icon: (
      <StepStatusIcon
        status={StepOutputStatus.FAILED}
        size="3"
        hideTooltip={true}
      />
    ),
  },
  'needs-test': {
    variant: 'default',
    text: t('Test me'),
    icon: <TriangleAlert className="size-3" />,
  },
  tested: {
    variant: 'success',
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

ApStepNodeStatusInDraft.displayName = 'ApStepNodeStatusInDraft';
export { ApStepNodeStatusInDraft };
