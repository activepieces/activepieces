import { ChevronRight, Info } from 'lucide-react';
import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { PieceStepMetadata } from '@/lib/types';
import {
  FlowAction,
  FlowActionType,
  isNil,
  FlowTrigger,
  FlowTriggerType,
} from '@activepieces/shared';

type StepCardProps = {
  step: FlowAction | FlowTrigger;
};

const StepCard: React.FC<StepCardProps> = ({ step }) => {
  const { stepMetadata } = stepsHooks.useStepMetadata({
    step,
  });

  const isPiece =
    stepMetadata?.type === FlowActionType.PIECE ||
    stepMetadata?.type === FlowTriggerType.PIECE;
  const pieceVersion = isPiece
    ? (stepMetadata as PieceStepMetadata)?.pieceVersion
    : undefined;
  const actionOrTriggerDisplayName =
    stepMetadata?.actionOrTriggerOrAgentDisplayName;

  if (!isPiece) {
    return <></>;
  }

  return (
    <div className="flex items-center justify-between gap-3 min-h-[36px]">
      <div className="flex items-center gap-2 min-w-0">
        <PieceIcon
          logoUrl={stepMetadata?.logoUrl}
          displayName={stepMetadata?.displayName}
          showTooltip={false}
          size="sm"
        />
        <div className="flex items-center gap-1 min-w-0 text-sm">
          {!isNil(stepMetadata?.displayName) ? (
            <>
              <span className="truncate text-muted-foreground">
                {stepMetadata.displayName}
              </span>
              {actionOrTriggerDisplayName && (
                <>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                  <span className="truncate font-medium text-foreground">
                    {actionOrTriggerDisplayName}
                  </span>
                </>
              )}
            </>
          ) : (
            <Skeleton className="h-4 w-32 rounded" />
          )}
        </div>
        {!isNil(stepMetadata?.actionOrTriggerOrAgentDescription) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="size-4 text-muted-foreground shrink-0 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              {stepMetadata.actionOrTriggerOrAgentDescription}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {pieceVersion && (
        <div className="text-xs text-muted-foreground shrink-0">
          v{pieceVersion}
        </div>
      )}
    </div>
  );
};

export { StepCard };
