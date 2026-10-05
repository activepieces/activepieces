import {
  ComponentIntent,
  isPieceVisible,
  PieceSelection,
  PieceSelectionMode,
  PieceSet,
  RequiredAction,
  RequiredActionsMode,
  UpdatePieceSetRequestBody,
} from '@activepieces/shared';

function apply({
  pieceSet,
  change,
}: {
  pieceSet: PieceSet;
  change: PieceSetChange;
}): PieceSet {
  switch (change.type) {
    case 'visibility':
      return withConfig(pieceSet, {
        pieces: Object.entries(change.visible).reduce(
          (pieces, [name, visible]) =>
            setPieceVisible({ pieces, name, visible }),
          pieceSet.config.pieces,
        ),
      });
    case 'newPieces':
      return withConfig(pieceSet, {
        pieces:
          change.restore ??
          setNewPiecesMode({
            current: pieceSet.config.pieces,
            include: change.include,
            knownPieceNames: change.knownPieceNames,
          }),
      });
    case 'requiredMode':
      return withConfig(pieceSet, { requiredActionsMode: change.mode });
    case 'required':
      return withConfig(pieceSet, {
        requiredActions: change.requiredActions,
        requiredActionsMode: change.mode,
      });
    case 'components':
      return withConfig(pieceSet, {
        selectedActions: withIntent({
          selected: pieceSet.config.selectedActions,
          pieceName: change.pieceName,
          intent: change.actions,
        }),
        selectedTriggers: withIntent({
          selected: pieceSet.config.selectedTriggers,
          pieceName: change.pieceName,
          intent: change.triggers,
        }),
      });
  }
}

function toRequest({
  pieceSet,
  change,
}: {
  pieceSet: PieceSet;
  change: PieceSetChange;
}): UpdatePieceSetRequestBody {
  const next = apply({ pieceSet, change });
  switch (change.type) {
    case 'visibility':
    case 'newPieces':
      return { pieces: next.config.pieces };
    case 'requiredMode':
      return { requiredActionsMode: next.config.requiredActionsMode };
    case 'required':
      return {
        requiredActions: next.config.requiredActions,
        requiredActionsMode: next.config.requiredActionsMode,
      };
    case 'components':
      return {
        actions: { [change.pieceName]: change.actions },
        triggers: { [change.pieceName]: change.triggers },
      };
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
    case 'visibility':
      return {
        type: 'visibility',
        label: change.label,
        visible: Object.fromEntries(
          Object.keys(change.visible).map((name) => [
            name,
            isPieceVisible({ pieces: previous.config.pieces, name }),
          ]),
        ),
      };
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
        mode: previous.config.requiredActionsMode ?? RequiredActionsMode.ANY,
      };
    case 'required':
      return {
        type: 'required',
        requiredActions: previous.config.requiredActions ?? [],
        mode: previous.config.requiredActionsMode ?? RequiredActionsMode.ANY,
      };
    case 'components':
      return {
        type: 'components',
        pieceName: change.pieceName,
        pieceDisplayName: change.pieceDisplayName,
        actions: intentOf({
          selected: previous.config.selectedActions,
          pieceName: change.pieceName,
        }),
        triggers: intentOf({
          selected: previous.config.selectedTriggers,
          pieceName: change.pieceName,
        }),
      };
  }
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

function withConfig(
  pieceSet: PieceSet,
  config: Partial<PieceSet['config']>,
): PieceSet {
  return { ...pieceSet, config: { ...pieceSet.config, ...config } };
}

function withIntent({
  selected,
  pieceName,
  intent,
}: {
  selected: Record<string, string[]>;
  pieceName: string;
  intent: ComponentIntent;
}): Record<string, string[]> {
  const { [pieceName]: _dropped, ...rest } = selected;
  return intent.mode === 'all'
    ? rest
    : { ...rest, [pieceName]: intent.selected };
}

function intentOf({
  selected,
  pieceName,
}: {
  selected: Record<string, string[]>;
  pieceName: string;
}): ComponentIntent {
  const names = selected[pieceName];
  return names === undefined
    ? { mode: 'all' }
    : { mode: 'selected', selected: names };
}

function sameConfig(a: PieceSet['config'], b: PieceSet['config']): boolean {
  return canonicalConfig(a) === canonicalConfig(b);
}

function canonicalConfig(config: PieceSet['config']): string {
  return JSON.stringify([
    config.pieces.mode,
    [...config.pieces.exceptions].sort(),
    canonicalSelection(config.selectedActions),
    canonicalSelection(config.selectedTriggers),
    (config.requiredActions ?? [])
      .map((action) => `${action.pieceName}:${action.actionName}`)
      .sort(),
    config.requiredActionsMode ?? RequiredActionsMode.ANY,
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
  sameConfig,
  setPieceVisible,
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
      requiredActions: RequiredAction[];
      mode: RequiredActionsMode;
    }
  | {
      type: 'components';
      pieceName: string;
      pieceDisplayName: string;
      actions: ComponentIntent;
      triggers: ComponentIntent;
    };

export type ChangePieceSet = (change: PieceSetChange) => Promise<boolean>;
