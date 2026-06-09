import type { OutputSchema } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';

import { piecesHooks } from './pieces-hooks';

function usePieceOutputSchema({
  pieceName,
  pieceVersion,
  stepName,
}: {
  pieceName?: string;
  pieceVersion?: string;
  stepName?: string;
}): OutputSchema | null {
  const { pieceModel } = piecesHooks.usePiece({
    name: pieceName ?? '',
    version: pieceVersion,
    enabled: !isNil(pieceName) && !isNil(stepName),
  });

  if (!pieceModel || !stepName) return null;
  const fromTrigger = pieceModel.triggers?.[stepName]?.outputSchema;
  if (fromTrigger) return fromTrigger;
  const fromAction = pieceModel.actions?.[stepName]?.outputSchema;
  if (fromAction) return fromAction;
  return null;
}

export { usePieceOutputSchema };
