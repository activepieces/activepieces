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
  query,
}: {
  text: string | undefined;
  query: string;
}): boolean {
  return (text ?? '').toLowerCase().includes(query);
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
  const popular = pieceSearchUtils.POPULAR_PIECES_NAMES;
  const rank = (piece: PieceMetadataModelSummary) => {
    const index = popular.indexOf(piece.name);
    return index === -1 ? popular.length : index;
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
  const ordered = orderPopularFirst(
    pieces.filter((piece) => (piece.suggestedActions ?? []).length > 0),
  );
  const query = searchQuery.trim().toLowerCase();

  if (query === '') {
    return ordered.map((piece) =>
      toReachablePiece({
        piece,
        actions: piece.suggestedActions ?? [],
        forceExpanded: false,
      }),
    );
  }

  return ordered.flatMap((piece) => {
    const actions = piece.suggestedActions ?? [];
    const pieceMatches =
      containsQuery({ text: piece.displayName, query }) ||
      containsQuery({ text: piece.description, query });
    if (pieceMatches) {
      return [toReachablePiece({ piece, actions, forceExpanded: false })];
    }
    const matchingActions = actions.filter(
      (action) =>
        containsQuery({ text: action.displayName, query }) ||
        containsQuery({ text: action.description, query }),
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
