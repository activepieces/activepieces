import { isNil, PieceSet, ProjectWithLimits } from '@activepieces/shared';

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

function isAssignedToSet({
  pieceSet,
  project,
}: {
  pieceSet: PieceSet;
  project: ProjectRef;
}): boolean {
  if (pieceSet.isDefault) {
    return project.pieceSetId === pieceSet.id || isNil(project.pieceSetId);
  }
  return project.pieceSetId === pieceSet.id;
}

function assignRow({
  pieceSet,
  project,
  defaultSetId,
  setNames,
}: {
  pieceSet: PieceSet;
  project: ProjectRef;
  defaultSetId: string | undefined;
  setNames: Map<string, string>;
}): AssignRow {
  if (isAssignedToSet({ pieceSet, project })) {
    return pieceSet.isDefault
      ? { locked: true, lockedIn: pieceSet.name, currentlyIn: null }
      : { locked: false, lockedIn: null, currentlyIn: null };
  }
  const current = project.pieceSetId ?? defaultSetId;
  return {
    locked: false,
    lockedIn: null,
    currentlyIn: isNil(current) ? null : setNames.get(current) ?? null,
  };
}

export const projectPieceSet = { currentSetId, isAssignedToSet, assignRow };

type ProjectRef = Pick<ProjectWithLimits, 'pieceSetId'>;

export type AssignRow = {
  locked: boolean;
  lockedIn: string | null;
  currentlyIn: string | null;
};
