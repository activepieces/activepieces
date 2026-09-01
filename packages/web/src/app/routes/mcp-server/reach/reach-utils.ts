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

function containsQuery({
  text,
  lowercaseQuery,
}: {
  text: string | undefined;
  lowercaseQuery: string;
}): boolean {
  return (text ?? '').toLowerCase().includes(lowercaseQuery);
}

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
  actions,
  forceExpanded,
}: {
  piece: PieceMetadataModelSummary;
  actions: ActionBase[];
  forceExpanded: boolean;
}): ReachablePiece {
  const groups = groupByClassification(actions);
  return {
    piece,
    groups,
    actionCount: actions.length,
    destructiveActionCount: actions.filter(
      (action) => action.classification === 'DESTRUCTIVE',
    ).length,
    forceExpanded,
  };
}

function toReachablePieces({
  pieces,
  searchQuery,
}: {
  pieces: PieceMetadataModelSummary[];
  searchQuery: string;
}): ReachablePiece[] {
  const orderedPieces = orderPopularFirst(
    pieces.filter((piece) => (piece.suggestedActions ?? []).length > 0),
  );
  const lowercaseQuery = searchQuery.trim().toLowerCase();

  if (lowercaseQuery === '') {
    return orderedPieces.map((piece) =>
      toReachablePiece({
        piece,
        actions: piece.suggestedActions ?? [],
        forceExpanded: false,
      }),
    );
  }

  return orderedPieces.flatMap((piece) => {
    const actions = piece.suggestedActions ?? [];
    const pieceMatches =
      containsQuery({ text: piece.displayName, lowercaseQuery }) ||
      containsQuery({ text: piece.description, lowercaseQuery });
    if (pieceMatches) {
      return [toReachablePiece({ piece, actions, forceExpanded: false })];
    }
    const matchingActions = actions.filter(
      (action) =>
        containsQuery({ text: action.displayName, lowercaseQuery }) ||
        containsQuery({ text: action.description, lowercaseQuery }),
    );
    if (matchingActions.length === 0) {
      return [];
    }
    return [
      toReachablePiece({
        piece,
        actions: matchingActions,
        forceExpanded: true,
      }),
    ];
  });
}

export const reachUtils = { toReachablePieces };

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
