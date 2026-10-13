import { PieceSet } from '@activepieces/shared';

function currentSetId({
  pieceSetId,
  pieceSets,
}: {
  pieceSetId: string | null | undefined;
  pieceSets: PieceSet[];
}): string | undefined {
  const assigned = pieceSets.find((set) => set.id === pieceSetId);
  return (assigned ?? pieceSets.find((set) => set.isDefault))?.id;
}

export const projectPieceSet = { currentSetId };
