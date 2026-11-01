import {
  FlowTrigger,
  FlowActionType,
  flowStructureUtil,
  PieceCategory,
  swatchUtils,
} from '@activepieces/shared';
import { useMemo } from 'react';

import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { StepMetadata } from '@/features/pieces/types';
import { extractPieceNamesAndCoreMetadata } from '@/features/pieces/utils/step-utils';

const GRADIENT_HUE_GAP = 5;

function buildGradientFromSeed(seed: string): string {
  if (seed.length === 0) {
    return '';
  }
  const from = swatchUtils.varsForSeed({ seed });
  const to = swatchUtils.varsFor({
    index: swatchUtils.hashToIndex({ seed }) + GRADIENT_HUE_GAP,
  });
  return `linear-gradient(135deg, ${from.surface}, ${to.surface})`;
}

export const useGradientFromPieces = (
  trigger: FlowTrigger | undefined,
  excludeCore = false,
) => {
  const steps = useMemo(
    () => (trigger ? flowStructureUtil.getAllSteps(trigger) : []),
    [trigger],
  );

  const { pieceNames, coreMetadata } = useMemo(
    () => extractPieceNamesAndCoreMetadata(steps, excludeCore),
    [steps, excludeCore],
  );

  const { summaries } = piecesHooks.usePieceSummariesByNames({
    names: pieceNames,
  });

  const uniqueMetadata: StepMetadata[] = useMemo(() => {
    const pieceMetadata: StepMetadata[] = summaries
      .filter(
        (piece) =>
          !excludeCore || !piece.categories?.includes(PieceCategory.CORE),
      )
      .map((piece) => ({
        displayName: piece.displayName,
        logoUrl: piece.logoUrl,
        description: piece.description,
        type: FlowActionType.PIECE as const,
        pieceType: piece.pieceType,
        pieceName: piece.name,
        pieceVersion: piece.version,
        categories: piece.categories ?? [],
        packageType: piece.packageType,
        auth: piece.auth,
      }));

    const allMetadata = [...coreMetadata, ...pieceMetadata];
    return allMetadata.filter(
      (item, index, self) =>
        self.findIndex(
          (secondItem) => item.displayName === secondItem.displayName,
        ) === index,
    );
  }, [summaries, coreMetadata, excludeCore]);

  const gradient = useMemo(
    () => buildGradientFromSeed(uniqueMetadata[0]?.displayName ?? ''),
    [uniqueMetadata],
  );

  return { gradient, piecesMetadata: uniqueMetadata };
};
