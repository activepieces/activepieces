import React from 'react';

import ImageWithFallback from '@/components/ui/image-with-fallback';
import { Skeleton } from '@/components/ui/skeleton';
import { stepUtils } from '@/features/pieces/lib/step-utils';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { PieceStepMetadata } from '@/lib/types';
import {
  Action,
  ActionType,
  isNil,
  Trigger,
  TriggerType,
} from '@activepieces/shared';

import { EditAgentInFlowBuilderButton } from './edit-agent-inside-flow-builder-button';

type StepCardProps = {
  step: Action | Trigger;
};

const StepCard: React.FC<StepCardProps> = ({ step }) => {
  const { stepMetadata } = stepsHooks.useStepMetadata({
    step,
  });

  const isPiece =
    stepMetadata?.type === ActionType.PIECE ||
    stepMetadata?.type === TriggerType.PIECE;
  const pieceVersion = isPiece
    ? (stepMetadata as PieceStepMetadata)?.pieceVersion
    : undefined;
  const actionOrTriggerDisplayName =
    stepMetadata?.actionOrTriggerOrAgentDisplayName;
  const modifiedTitle = stepMetadata
    ? `${stepMetadata?.displayName} ${
        actionOrTriggerDisplayName ? `(${actionOrTriggerDisplayName})` : ''
      }`
    : null;
  const agentId = stepUtils.getAgentId(step);

  return (
    <div className="flex items-center justify-center gap-4 min-h-[48px]">
      <div className="flex h-full min-w-[48px] items-center justify-center">
        {stepMetadata?.logoUrl && (
          <ImageWithFallback
            src={stepMetadata.logoUrl}
            alt={modifiedTitle ?? ''}
            className="w-12 h-12"
          />
        )}
      </div>
      <div className="flex h-full grow justify-center gap-2 text-start">
        <div className="text-base flex flex-col grow gap-1">
          <div className="flex-grow">
            {!isNil(modifiedTitle) ? (
              modifiedTitle
            ) : (
              <Skeleton className="h-3 w-32 rounded" />
            )}
          </div>
          <div className="overflow-hidden text-ellipsis text-xs text-muted-foreground">
            {!isNil(stepMetadata?.description) ? (
              stepMetadata.description
            ) : (
              <div className="flex flex-col gap-1">
                <Skeleton className="h-2 w-48 rounded" />
              </div>
            )}
          </div>
        </div>
        <div className="flex  items-center gap-2">
          {agentId && <EditAgentInFlowBuilderButton agentId={agentId} />}
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
