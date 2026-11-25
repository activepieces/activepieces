import { ErrorCode } from '@activepieces/core-utils';
import { PieceMetadataModel } from '@activepieces/pieces-framework';
import { useMemo } from 'react';

import { piecesHooks } from '@/features/pieces';
import { api } from '@/lib/api';

export function useRequiredActionsGroupedByPiece({
  actions,
}: {
  actions: Record<string, string[]>;
}) {
  const pieceNames = useMemo(() => Object.keys(actions), [actions]);
  const pieceQueries = piecesHooks.useMultiplePieces({ names: pieceNames });
  const isLoading = pieceQueries.some((query) => query.isLoading);
  const failedQueries = pieceQueries.filter(
    (query) =>
      query.isLoadingError &&
      !api.isApError(query.error, ErrorCode.ENTITY_NOT_FOUND),
  );

  const requiredActionsGroupedByPiece = useMemo(() => {
    const allPieces = pieceNames.map((pieceName, index) =>
      toRequiredActionGroup({
        pieceName,
        piece: pieceQueries[index]?.data,
        actionNames: actions[pieceName],
        isPieceLoading: isLoading,
      }),
    );
    return allPieces.filter((piece) => piece.actions.length > 0);
  }, [actions, pieceNames, pieceQueries, isLoading]);

  const actionsInLatestPieceVersionCount = requiredActionsGroupedByPiece
    .flatMap((group) => group.actions)
    .filter((action) => !action.notInLatestPieceVersion).length;

  return {
    requiredActionsGroupedByPiece,
    actionsInLatestPieceVersionCount,
    isLoading,
    isError: failedQueries.length > 0,
    refetch: () => Promise.all(failedQueries.map((query) => query.refetch())),
  };
}

function toRequiredActionGroup({
  pieceName,
  piece,
  actionNames,
  isPieceLoading,
}: {
  pieceName: string;
  piece: PieceMetadataModel | undefined;
  actionNames: string[];
  isPieceLoading: boolean;
}): RequiredActionGroup {
  const actions = actionNames.map((actionName) => ({
    name: actionName,
    displayName: piece?.actions[actionName]?.displayName ?? actionName,
    notInLatestPieceVersion: !isPieceLoading && !piece?.actions[actionName],
  }));
  return {
    pieceName,
    displayName: piece?.displayName ?? pieceName,
    logoUrl: piece?.logoUrl,
    actions,
  };
}

export type RequiredActionGroup = {
  pieceName: string;
  displayName: string;
  logoUrl: string | undefined;
  actions: {
    name: string;
    displayName: string;
    notInLatestPieceVersion: boolean;
  }[];
};
