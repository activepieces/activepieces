import React from 'react';

import ImageWithFallback from '@/components/ui/image-with-fallback';
import { Skeleton } from '@/components/ui/skeleton';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { PieceStepMetadata } from '@/lib/types';
import {
  FlowAction,
  FlowActionType,
  flowStructureUtil,
  FlowTrigger,
  FlowTriggerType,
} from '@activepieces/shared';

import { EditAgentInFlowBuilderButton } from './edit-agent-inside-flow-builder-button';
import { Info, ChevronRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  const externalAgentId = flowStructureUtil.getExternalAgentId(step);

  return (
    <div className="flex items-center justify-center gap-2">
      <div className="flex h-full items-center justify-center">
        {stepMetadata?.logoUrl && (
          <ImageWithFallback
            src={stepMetadata.logoUrl}
            alt={stepMetadata?.displayName ?? ''}
            className="w-5 h-5"
          />
        )}
      </div>
      <div className="flex h-full grow justify-center gap-2 text-start">
        <div className="text-base flex flex-col grow gap-1">
          <div className="flex-grow">
            {stepMetadata ? (
              <div className="text-sm flex items-center gap-1">
                <span>{stepMetadata.displayName}</span>
                {actionOrTriggerDisplayName && (
                  <>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    <span>{actionOrTriggerDisplayName}</span>
                  </>
                )}
                {stepMetadata?.description && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {stepMetadata.description}
                    </TooltipContent>
                  </Tooltip>
                )}
                {!stepMetadata?.description && <Info className="w-4 h-4" />}
              </div>
            ) : (
              <Skeleton className="h-3 w-32 rounded" />
            )}
          </div>
        </div>
        <div className="flex  items-center gap-2">
          {externalAgentId && (
            <EditAgentInFlowBuilderButton externalAgentId={externalAgentId} />
          )}
          {pieceVersion && (
            <div className="text-xs text-muted-foreground flex justify-center items-center">
              v{pieceVersion}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { StepCard };
