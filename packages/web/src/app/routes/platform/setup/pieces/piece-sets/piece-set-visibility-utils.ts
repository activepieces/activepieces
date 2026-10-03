import {
  PieceSelection,
  PieceSelectionMode,
  PieceSet,
  requiredActionsUtil,
  UpdatePieceSetRequestBody,
} from '@activepieces/shared';

function setPiecesVisible({
  pieces,
  pieceNames,
  visible,
}: {
  pieces: PieceSelection;
  pieceNames: string[];
  visible: boolean;
}): PieceSelection {
  const exceptionMeansHidden = pieces.mode === PieceSelectionMode.INCLUDE_ALL;
  const exceptionsWithout = pieces.exceptions.filter(
    (name) => !pieceNames.includes(name),
  );
  const shouldBeExceptions = exceptionMeansHidden ? !visible : visible;
  return {
    mode: pieces.mode,
    exceptions: shouldBeExceptions
      ? [...exceptionsWithout, ...pieceNames]
      : exceptionsWithout,
  };
}

function findHiddenRequiredActions({
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
  return requiredActionsUtil.findHiddenRequiredActions({
    config: configAfterChange,
    requiredActions: config.requiredActions.actions,
  });
}

function hasHiddenRequiredActions({
  pieceSet,
  request,
}: {
  pieceSet: PieceSet;
  request: UpdatePieceSetRequestBody;
}): boolean {
  return (
    Object.keys(findHiddenRequiredActions({ pieceSet, request })).length > 0
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

export const pieceSetVisibilityUtils = {
  setPiecesVisible,
  findHiddenRequiredActions,
  hasHiddenRequiredActions,
  determineSelectionCheckboxState,
};
