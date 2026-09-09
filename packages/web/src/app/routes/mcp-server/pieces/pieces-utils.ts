import type {
  ActionBase,
  ActionClassification,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';

import { pieceSearchUtils } from '@/features/pieces/utils/piece-search-utils';

const CLASSIFICATION_ORDER: ActionClassification[] = [
  'READ',
  'SEARCH',
  'WRITE',
  'DESTRUCTIVE',
];

const DEFAULT_CLASSIFICATION: ActionClassification = 'WRITE';

function groupByClassification(actions: ActionBase[]): ActionGroup[] {
  return CLASSIFICATION_ORDER.map((classification) => ({
    classification,
    actions: actions.filter(
      (action) =>
        (action.classification ?? DEFAULT_CLASSIFICATION) === classification,
    ),
  })).filter((group) => group.actions.length > 0);
}

function orderPopularFirst(
  pieces: PieceMetadataModelSummary[],
): PieceMetadataModelSummary[] {
  const popularPieceNames = pieceSearchUtils.POPULAR_PIECES_NAMES;
  const rank = (piece: PieceMetadataModelSummary) => {
    const index = popularPieceNames.indexOf(piece.name);
    return index === -1 ? popularPieceNames.length : index;
  };
  return [...pieces].sort(
    (a, b) => rank(a) - rank(b) || a.displayName.localeCompare(b.displayName),
  );
}

function toReachablePiece({
  piece,
  isSearching,
}: {
  piece: PieceMetadataModelSummary;
  isSearching: boolean;
}): ReachablePiece {
  const actions = piece.suggestedActions ?? [];
  return {
    piece,
    groups: groupByClassification(actions),
    actionCount: actions.length,
    destructiveActionCount: actions.filter(
      (action) => action.classification === 'DESTRUCTIVE',
    ).length,
    forceExpanded: isSearching,
  };
}

function toReachablePieces({
  pieces,
  isSearching,
}: {
  pieces: PieceMetadataModelSummary[];
  isSearching: boolean;
}): ReachablePiece[] {
  const piecesWithActions = pieces.filter(
    (piece) => (piece.suggestedActions ?? []).length > 0,
  );
  const orderedPieces = isSearching
    ? piecesWithActions
    : orderPopularFirst(piecesWithActions);
  return orderedPieces.map((piece) => toReachablePiece({ piece, isSearching }));
}

export const piecesUtils = { toReachablePieces };

export type ActionGroup = {
  classification: ActionClassification;
  actions: ActionBase[];
};

export type ReachablePiece = {
  piece: PieceMetadataModelSummary;
  groups: ActionGroup[];
  actionCount: number;
  destructiveActionCount: number;
  forceExpanded: boolean;
};
