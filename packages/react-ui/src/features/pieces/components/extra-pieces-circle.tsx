import { useMemo } from 'react';

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
  const extraPieces = piecesHooks.useMultiplePieces({ names: pieces });

  const extraStepsPieces = useMemo(() => {
    if (!extraPieces) return [];
    const pieceNames = new Set<string>();
    extraPieces.forEach((piece) => {
      if (piece.data?.displayName) {
        pieceNames.add(piece.data?.displayName);
      }
    });
    return Array.from(pieceNames);
  }, [extraPieces]);

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
