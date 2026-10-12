import { unique } from '@activepieces/core-utils';
import {
  ComponentSelection,
  isPieceVisible,
  PieceSelection,
  PieceSelectionMode,
  PieceSet,
  pieceSetConfigUtil,
  RequiredActionsMode,
  requiredActionsUtil,
  UpdatePieceSetRequestBody,
} from '@activepieces/shared';

function apply({
  pieceSet,
  change,
}: {
  pieceSet: PieceSet;
  change: PieceSetChange;
}): PieceSet {
  const request = toRequest({ pieceSet, change });
  return {
    ...pieceSet,
    config: pieceSetConfigUtil.applyUpdate({
      current: pieceSet.config,
      request,
    }),
  };
}

function toRequest({
  pieceSet,
  change,
}: {
  pieceSet: PieceSet;
  change: PieceSetChange;
}): UpdatePieceSetRequestBody {
  const { config } = pieceSet;
  switch (change.type) {
    case 'visibility':
      return {
        pieces: Object.entries(change.visible).reduce(
          (pieces, [name, visible]) =>
            setPieceVisible({ pieces, name, visible }),
          config.pieces,
        ),
      };
    case 'newPieces':
      return {
        pieces:
          change.restore ??
          setNewPiecesMode({
            current: config.pieces,
            include: change.include,
            knownPieceNames: change.knownPieceNames,
          }),
      };
    case 'requiredMode':
      return { requiredActions: { mode: change.mode } };
    case 'required':
      return requiredRequest({ pieceSet, change });
    case 'components':
      return {
        actions: { [change.pieceName]: change.actions },
        triggers: { [change.pieceName]: change.triggers },
      };
    case 'restore':
      return restoreRequest({ current: config, target: change.config });
  }
}

function inverse({
  previous,
  change,
}: {
  previous: PieceSet;
  change: PieceSetChange;
}): PieceSetChange {
  switch (change.type) {
    case 'newPieces':
      return {
        type: 'newPieces',
        include: previous.config.pieces.mode === PieceSelectionMode.INCLUDE_ALL,
        knownPieceNames: change.knownPieceNames,
        restore: previous.config.pieces,
      };
    case 'requiredMode':
      return {
        type: 'requiredMode',
        mode: previous.config.requiredActions.mode,
      };
    case 'visibility':
    case 'required':
    case 'components':
    case 'restore':
      return { type: 'restore', config: previous.config };
  }
}

function excludedRequiredActions({
  pieceSet,
  change,
}: {
  pieceSet: PieceSet;
  change: PieceSetChange;
}): Record<string, string[]> {
  const next = apply({ pieceSet, change });
  return requiredActionsUtil.findExcludedRequiredActions({
    config: next.config,
    requiredActions: pieceSet.config.requiredActions.actions,
  });
}

function requiredRequest({
  pieceSet,
  change,
}: {
  pieceSet: PieceSet;
  change: Extract<PieceSetChange, { type: 'required' }>;
}): UpdatePieceSetRequestBody {
  const { selectedActions } = pieceSet.config;
  const widened = Object.entries(change.actions).flatMap(
    ([pieceName, actionNames]): [string, ComponentSelection][] => {
      const selected = selectedActions[pieceName];
      if (
        selected === undefined ||
        actionNames.every((name) => selected.includes(name))
      ) {
        return [];
      }
      return [
        [
          pieceName,
          { mode: 'selected', selected: unique([...selected, ...actionNames]) },
        ],
      ];
    },
  );
  return {
    ...(widened.length > 0 ? { actions: Object.fromEntries(widened) } : {}),
    requiredActions: {
      ...(change.mode === undefined ? {} : { mode: change.mode }),
      actions: change.actions,
    },
  };
}

function restoreRequest({
  current,
  target,
}: {
  current: PieceSet['config'];
  target: PieceSet['config'];
}): UpdatePieceSetRequestBody {
  return {
    pieces: target.pieces,
    actions: selectionsToRestore({
      current: current.selectedActions,
      target: target.selectedActions,
    }),
    triggers: selectionsToRestore({
      current: current.selectedTriggers,
      target: target.selectedTriggers,
    }),
    requiredActions: {
      mode: target.requiredActions.mode,
      actions: Object.fromEntries(
        unique([
          ...Object.keys(current.requiredActions.actions),
          ...Object.keys(target.requiredActions.actions),
        ]).map((pieceName) => [
          pieceName,
          target.requiredActions.actions[pieceName] ?? [],
        ]),
      ),
    },
  };
}

function selectionsToRestore({
  current,
  target,
}: {
  current: Record<string, string[]>;
  target: Record<string, string[]>;
}): Record<string, ComponentSelection> {
  return Object.fromEntries(
    unique([...Object.keys(current), ...Object.keys(target)]).map(
      (pieceName): [string, ComponentSelection] => {
        const selected = target[pieceName];
        return [
          pieceName,
          selected === undefined
            ? { mode: 'all' }
            : { mode: 'selected', selected },
        ];
      },
    ),
  );
}

function setPieceVisible({
  pieces,
  name,
  visible,
}: {
  pieces: PieceSelection;
  name: string;
  visible: boolean;
}): PieceSelection {
  const isException = pieces.exceptions.includes(name);
  const shouldBeException =
    pieces.mode === PieceSelectionMode.INCLUDE_ALL ? !visible : visible;
  if (isException === shouldBeException) {
    return pieces;
  }
  return {
    mode: pieces.mode,
    exceptions: shouldBeException
      ? [...pieces.exceptions, name]
      : pieces.exceptions.filter((candidate) => candidate !== name),
  };
}

function setNewPiecesMode({
  current,
  include,
  knownPieceNames,
}: {
  current: PieceSelection;
  include: boolean;
  knownPieceNames: string[];
}): PieceSelection {
  const mode = include
    ? PieceSelectionMode.INCLUDE_ALL
    : PieceSelectionMode.EXCLUDE_ALL;
  if (current.mode === mode) {
    return current;
  }
  const listed = new Set(current.exceptions);
  return {
    mode,
    exceptions: knownPieceNames.filter((name) => !listed.has(name)),
  };
}

function isActionAllowed({
  pieceSet,
  pieceName,
  actionName,
}: {
  pieceSet: PieceSet;
  pieceName: string;
  actionName: string;
}): boolean {
  const selected = pieceSet.config.selectedActions[pieceName];
  return (
    isPieceVisible({ pieces: pieceSet.config.pieces, name: pieceName }) &&
    (selected === undefined || selected.includes(actionName))
  );
}

function countRequiredActions(config: PieceSet['config']): number {
  return Object.values(config.requiredActions.actions).flat().length;
}

function sameConfig({
  left,
  right,
}: {
  left: PieceSet['config'];
  right: PieceSet['config'];
}): boolean {
  return canonicalConfig(left) === canonicalConfig(right);
}

function canonicalConfig(config: PieceSet['config']): string {
  return JSON.stringify([
    config.pieces.mode,
    [...config.pieces.exceptions].sort(),
    canonicalSelection(config.selectedActions),
    canonicalSelection(config.selectedTriggers),
    canonicalSelection(config.requiredActions.actions).filter(
      ([, actionNames]) => actionNames.length > 0,
    ),
    config.requiredActions.mode,
  ]);
}

function canonicalSelection(
  selected: Record<string, string[]>,
): [string, string[]][] {
  return Object.keys(selected)
    .sort()
    .map((pieceName) => [pieceName, [...selected[pieceName]].sort()]);
}

export const pieceSetChanges = {
  apply,
  toRequest,
  inverse,
  excludedRequiredActions,
  isActionAllowed,
  countRequiredActions,
  sameConfig,
};

export type PieceSetChange =
  | { type: 'visibility'; visible: Record<string, boolean>; label?: string }
  | {
      type: 'newPieces';
      include: boolean;
      knownPieceNames: string[];
      restore?: PieceSelection;
    }
  | { type: 'requiredMode'; mode: RequiredActionsMode }
  | {
      type: 'required';
      actions: Record<string, string[]>;
      mode?: RequiredActionsMode;
    }
  | {
      type: 'components';
      pieceName: string;
      pieceDisplayName: string;
      actions: ComponentSelection;
      triggers: ComponentSelection;
    }
  | { type: 'restore'; config: PieceSet['config'] };

export type ChangePieceSet = (change: PieceSetChange) => Promise<boolean>;
