import type { OutputDisplayHints } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';

import { piecesHooks } from './pieces-hooks';

function usePieceOutputHints({
  pieceName,
  pieceVersion,
  stepName,
}: {
  pieceName?: string;
  pieceVersion?: string;
  stepName?: string;
}): OutputDisplayHints | null {
  const { pieceModel } = piecesHooks.usePiece({
    name: pieceName ?? '',
    version: pieceVersion,
    enabled: !isNil(pieceName) && !isNil(stepName),
  });

  if (!pieceModel || !stepName) return null;
  const fromTrigger = pieceModel.triggers?.[stepName]?.outputDisplayHints;
  if (fromTrigger) return fromTrigger;
  const fromAction = pieceModel.actions?.[stepName]?.outputDisplayHints;
  if (fromAction) return fromAction;
  return null;
}

export { usePieceOutputHints };
