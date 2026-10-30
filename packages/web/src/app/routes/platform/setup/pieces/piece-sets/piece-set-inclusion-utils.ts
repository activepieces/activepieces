import {
  PieceSelection,
  PieceSelectionMode,
  PieceSet,
  requiredActionsUtil,
  UpdatePieceSetRequestBody,
} from '@activepieces/shared';

function setPiecesIncluded({
  pieces,
  pieceNames,
  included,
}: {
  pieces: PieceSelection;
  pieceNames: string[];
  included: boolean;
}): PieceSelection {
  const exceptionMeansExcluded = pieces.mode === PieceSelectionMode.INCLUDE_ALL;
  const exceptionsWithout = pieces.exceptions.filter(
    (name) => !pieceNames.includes(name),
  );
  const shouldBeExceptions = exceptionMeansExcluded ? !included : included;
  return {
    mode: pieces.mode,
    exceptions: shouldBeExceptions
      ? [...exceptionsWithout, ...pieceNames]
      : exceptionsWithout,
  };
}

function findExcludedRequiredActions({
  pieceSet,
  request,
}: {
  pieceSet: PieceSet;
  request: UpdatePieceSetRequestBody;
}): Record<string, string[]> {
  const { config } = pieceSet;
  const configAfterChange = {
    ...config,
    pieces: request.pieces ?? config.pieces,
    selectedActions: {
      ...config.selectedActions,
      ...selectedActionsFromRequest(request),
    },
  };
  return requiredActionsUtil.findExcludedRequiredActions({
    config: configAfterChange,
    requiredActions: config.requiredActions.actions,
  });
}

function hasExcludedRequiredActions({
  pieceSet,
  request,
}: {
  pieceSet: PieceSet;
  request: UpdatePieceSetRequestBody;
}): boolean {
  return (
    Object.keys(findExcludedRequiredActions({ pieceSet, request })).length > 0
  );
}

function selectedActionsFromRequest(
  request: UpdatePieceSetRequestBody,
): Record<string, string[]> {
  const actionSelections = Object.entries(request.actions ?? {});
  const selectedEntries = actionSelections.flatMap(
    ([name, selection]): [string, string[]][] =>
      selection.mode === 'selected' ? [[name, selection.selected]] : [],
  );
  return Object.fromEntries(selectedEntries);
}

function determineSelectionCheckboxState({
  checkedCount,
  totalCount,
}: {
  checkedCount: number;
  totalCount: number;
}): boolean | 'indeterminate' {
  if (checkedCount === 0) {
    return false;
  }
  return checkedCount === totalCount ? true : 'indeterminate';
}

export const pieceSetInclusionUtils = {
  setPiecesIncluded,
  findExcludedRequiredActions,
  hasExcludedRequiredActions,
  determineSelectionCheckboxState,
};
