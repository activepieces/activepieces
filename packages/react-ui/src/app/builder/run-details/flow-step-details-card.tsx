import React from 'react';

import { CardListItem } from '@/components/ui/card-list';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { formatUtils } from '@/lib/utils';
import { Action, StepOutput, Trigger } from '@activepieces/shared';

type FlowStepDetailsCardProps = {
  stepOutput: StepOutput;
  step: Action | Trigger;
};

const FlowStepDetailsCard = React.memo(
  ({ stepOutput, step }: FlowStepDetailsCardProps) => {
    const { data: pieceMetadata } = piecesHooks.usePieceMetadata({
      step,
    });
    return (
      <CardListItem>
        <img className="w-6 h-6" src={pieceMetadata?.logoUrl} />
        <div>{step.displayName}</div>
        <div className="flex-grow"></div>
        <div className="flex flex-col">
          <span className="text-muted-foreground text-sm">
            {formatUtils.formatDuration(stepOutput.duration ?? 0, true)}
          </span>
        </div>
      </CardListItem>
    );
  },
);
FlowStepDetailsCard.displayName = 'FlowStepDetailsCard';

export { FlowStepDetailsCard };
