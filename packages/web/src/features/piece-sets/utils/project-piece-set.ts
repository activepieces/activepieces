import { PieceSet } from '@activepieces/shared';

import { pieceSetsApi } from '../api/piece-sets-api';

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

async function move({
  projectId,
  fromSetId,
  toSetId,
  pieceSets,
}: {
  projectId: string;
  fromSetId: string | undefined;
  toSetId: string;
  pieceSets: PieceSet[];
}): Promise<void> {
  if (fromSetId === toSetId) {
    return;
  }
  const target = pieceSets.find((set) => set.id === toSetId);
  if (target?.isDefault && fromSetId !== undefined) {
    await pieceSetsApi.removeProject(fromSetId, projectId);
    return;
  }
  await pieceSetsApi.assignProjects(toSetId, { projectIds: [projectId] });
}

export const projectPieceSet = { currentSetId, move };
