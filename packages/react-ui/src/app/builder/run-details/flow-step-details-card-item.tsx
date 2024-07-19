import React from 'react';

import { CardListItem } from '@/components/ui/card-list';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { useBuilderStateContext } from '@/hooks/builder-hooks';
import { cn, formatUtils } from '@/lib/utils';
import { Action, StepOutput, Trigger } from '@activepieces/shared';

import { StepStatusIcon } from './step-status-icon';

type FlowStepDetailsCardProps = {
  stepOutput: StepOutput;
  step: Action | Trigger;
};

const FlowStepDetailsCardItem = React.memo(
  ({ stepOutput, step }: FlowStepDetailsCardProps) => {
    const { data: pieceMetadata } = piecesHooks.usePieceMetadata({
      step,
    });

    const selectStep = useBuilderStateContext((state) => state.selectStep);
    const selectedStep = useBuilderStateContext((state) => state.selectedStep);

    return (
      <CardListItem
        onClick={() => selectStep({ path: [], stepName: step.name })}
        className={cn(
          'cursor-pointer',
          selectedStep?.stepName === step.name
            ? 'bg-accent text-accent-foreground'
            : '',
        )}
      >
        <img className="w-6 h-6" src={pieceMetadata?.logoUrl} />
        <div>{step.displayName}</div>
        <div className="flex-grow"></div>
        <div className="flex gap-2 justfy-center items-center">
          <span className="text-muted-foreground text-xs">
            {formatUtils.formatDuration(stepOutput.duration ?? 0, true)}
          </span>
          <StepStatusIcon status={stepOutput.status} size="4"></StepStatusIcon>
        </div>
      </CardListItem>
    );
  },
);
FlowStepDetailsCardItem.displayName = 'FlowStepDetailsCard';

export { FlowStepDetailsCardItem };
