import { useEffect, useMemo, useState } from 'react';

import { piecesHooks } from '../lib/pieces-hook';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function ExtraPiecesCircle({
  extraStepsCount,
  pieces,
}: {
  extraStepsCount: number;
  pieces: string[];
}) {
  const { data } = piecesHooks.useMultiplePieces({ names: pieces });

  const extraStepsPieces = useMemo(() => {
    if (!data) return [];
    const pieceNames = new Set<string>();
    data.forEach((piece) => {
      if (piece.displayName) {
        pieceNames.add(piece.displayName);
      }
    });
    return Array.from(pieceNames);
  }, [data]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center justify-center bg-accent p-2 rounded-full border border-solid size-[36px]">
          +{extraStepsCount}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <div>{extraStepsPieces.join(', ')}</div>
      </TooltipContent>
    </Tooltip>
  );
}
