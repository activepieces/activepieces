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

function containsQuery(text: string | undefined, query: string): boolean {
  return (text ?? '').toLowerCase().includes(query);
}

function groupByClassification(actions: ActionBase[]): ReachActionGroup[] {
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

function toPieceRow(
  piece: PieceMetadataModelSummary,
  actions: ActionBase[],
  forceExpanded: boolean,
): ReachRow {
  const groups = groupByClassification(actions);
  return {
    piece,
    groups,
    actionCount: actions.length,
    destructiveCount: actions.filter(
      (action) => action.classification === 'DESTRUCTIVE',
    ).length,
    forceExpanded,
  };
}

function buildRows({
  pieces,
  searchQuery,
}: {
  pieces: PieceMetadataModelSummary[];
  searchQuery: string;
}): ReachRow[] {
  const ordered = orderPopularFirst(
    pieces.filter((piece) => (piece.suggestedActions ?? []).length > 0),
  );
  const query = searchQuery.trim().toLowerCase();

  if (query === '') {
    return ordered.map((piece) =>
      toPieceRow(piece, piece.suggestedActions ?? [], false),
    );
  }

  return ordered.flatMap((piece) => {
    const actions = piece.suggestedActions ?? [];
    const pieceMatches =
      containsQuery(piece.displayName, query) ||
      containsQuery(piece.description, query);
    if (pieceMatches) {
      return [toPieceRow(piece, actions, false)];
    }
    const matchingActions = actions.filter(
      (action) =>
        containsQuery(action.displayName, query) ||
        containsQuery(action.description, query),
    );
    if (matchingActions.length === 0) {
      return [];
    }
    return [toPieceRow(piece, matchingActions, true)];
  });
}

export const reachUtils = { buildRows };

export type ReachActionGroup = {
  classification: ActionClassification;
  actions: ActionBase[];
};

export type ReachRow = {
  piece: PieceMetadataModelSummary;
  groups: ReachActionGroup[];
  actionCount: number;
  destructiveCount: number;
  forceExpanded: boolean;
};
