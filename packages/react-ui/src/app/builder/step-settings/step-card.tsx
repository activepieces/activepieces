import React from 'react';

import ImageWithFallback from '@/components/ui/image-with-fallback';
import { Skeleton } from '@/components/ui/skeleton';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { PieceStepMetadata } from '@/features/pieces/lib/types';
import { Action, ActionType, Trigger, TriggerType } from '@activepieces/shared';

type StepCardInfoProps = {
  onClick?: () => void;
  step: Action | Trigger;
};

const StepCardInfo: React.FC<StepCardInfoProps> = ({ step, onClick }) => {
  const { stepMetadata } = stepsHooks.useStepMetadata({
    step,
  });

  const isPiece =
    stepMetadata?.type === ActionType.PIECE ||
    stepMetadata?.type === TriggerType.PIECE;
  const pieceVersion = isPiece
    ? (stepMetadata as PieceStepMetadata)?.pieceVersion
    : undefined;
  const modifiedTitle = `${stepMetadata?.displayName} (${stepMetadata?.stepDisplayName})`;

  return (
    <div onClick={onClick} className="flex items-center justify-center gap-4">
      <div className="flex h-full min-w-[48px] items-center justify-center">
        {stepMetadata?.logoUrl && (
          <ImageWithFallback
            src={stepMetadata.logoUrl}
            alt={modifiedTitle ?? ''}
            className="w-12 h-12"
          />
        )}
      </div>
      <div className="flex h-full grow flex-col justify-center gap-1 text-start">
        <div className="text-base flex justify-center">
          <div className="flex-grow">
            {modifiedTitle != null ? (
              modifiedTitle
            ) : (
              <Skeleton className="h-5 w-32 rounded" />
            )}
          </div>
          {pieceVersion && (
            <div className="text-xs text-muted-foreground flex justify-center items-center">
              v{pieceVersion}
            </div>
          )}
        </div>
        <div className="overflow-hidden text-ellipsis text-xs text-muted-foreground">
          {stepMetadata?.description != null ? (
            stepMetadata.description
          ) : (
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-48 rounded" />
              <Skeleton className="h-4 w-40 rounded" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { StepCardInfo };
