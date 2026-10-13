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
        pieces: setNewPiecesMode({
          current: config.pieces,
          include: change.include,
          knownPieceNames: change.knownPieceNames,
          keptExceptions: change.keptExceptions ?? [],
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
    case 'patch':
      return patchRequest({ pieceSet, change });
  }
}

function inverse({
  previous,
  change,
}: {
  previous: PieceSet;
  change: PieceSetChange;
}): PieceSetChange {
  const required = previous.config.requiredActions.actions;
  const hadRequired = (pieceName: string) => required[pieceName] !== undefined;
  switch (change.type) {
    case 'newPieces': {
      const known = new Set(change.knownPieceNames);
      return {
        type: 'newPieces',
        include: previous.config.pieces.mode === PieceSelectionMode.INCLUDE_ALL,
        knownPieceNames: change.knownPieceNames,
        keptExceptions: previous.config.pieces.exceptions.filter(
          (name) => !known.has(name),
        ),
      };
    }
    case 'requiredMode':
      return {
        type: 'requiredMode',
        mode: previous.config.requiredActions.mode,
      };
    case 'visibility': {
      const pieceNames = Object.keys(change.visible);
      return revert({
        previous,
        visibilityOf: pieceNames,
        requiredOf: pieceNames.filter(hadRequired),
      });
    }
    case 'components':
      return revert({
        previous,
        actionsOf: [change.pieceName],
        triggersOf: [change.pieceName],
        requiredOf: hadRequired(change.pieceName) ? [change.pieceName] : [],
      });
    case 'required': {
      const pieceNames = Object.keys(change.actions);
      return revert({
        previous,
        actionsOf: pieceNames.filter(
          (pieceName) =>
            previous.config.selectedActions[pieceName] !== undefined,
        ),
        requiredOf: pieceNames,
        mode: change.mode !== undefined,
      });
    }
    case 'patch': {
      const touched = unique([
        ...Object.keys(change.visible ?? {}),
        ...Object.keys(change.actions ?? {}),
      ]);
      return revert({
        previous,
        visibilityOf: Object.keys(change.visible ?? {}),
        actionsOf: Object.keys(change.actions ?? {}),
        triggersOf: Object.keys(change.triggers ?? {}),
        requiredOf: unique([
          ...Object.keys(change.required ?? {}),
          ...touched.filter(hadRequired),
        ]),
        mode: change.requiredMode !== undefined,
      });
    }
  }
}

function revert({
  previous,
  visibilityOf = [],
  actionsOf = [],
  triggersOf = [],
  requiredOf = [],
  mode = false,
}: {
  previous: PieceSet;
  visibilityOf?: string[];
  actionsOf?: string[];
  triggersOf?: string[];
  requiredOf?: string[];
  mode?: boolean;
}): PieceSetChange {
  const { config } = previous;
  return {
    type: 'patch',
    ...(visibilityOf.length > 0
      ? {
          visible: Object.fromEntries(
            visibilityOf.map((name) => [
              name,
              isPieceVisible({ pieces: config.pieces, name }),
            ]),
          ),
        }
      : {}),
    ...(actionsOf.length > 0
      ? {
          actions: Object.fromEntries(
            actionsOf.map((name) => [
              name,
              selectionOf(config.selectedActions[name]),
            ]),
          ),
        }
      : {}),
    ...(triggersOf.length > 0
      ? {
          triggers: Object.fromEntries(
            triggersOf.map((name) => [
              name,
              selectionOf(config.selectedTriggers[name]),
            ]),
          ),
        }
      : {}),
    ...(requiredOf.length > 0
      ? {
          required: Object.fromEntries(
            requiredOf.map((name) => [
              name,
              config.requiredActions.actions[name] ?? [],
            ]),
          ),
        }
      : {}),
    ...(mode ? { requiredMode: config.requiredActions.mode } : {}),
  };
}

function selectionOf(selected: string[] | undefined): ComponentSelection {
  return selected === undefined
    ? { mode: 'all' }
    : { mode: 'selected', selected };
}

function patchRequest({
  pieceSet,
  change,
}: {
  pieceSet: PieceSet;
  change: Extract<PieceSetChange, { type: 'patch' }>;
}): UpdatePieceSetRequestBody {
  const hasRequired =
    change.required !== undefined || change.requiredMode !== undefined;
  return {
    ...(change.visible === undefined
      ? {}
      : {
          pieces: Object.entries(change.visible).reduce(
            (pieces, [name, visible]) =>
              setPieceVisible({ pieces, name, visible }),
            pieceSet.config.pieces,
          ),
        }),
    ...(change.actions === undefined ? {} : { actions: change.actions }),
    ...(change.triggers === undefined ? {} : { triggers: change.triggers }),
    ...(hasRequired
      ? {
          requiredActions: {
            ...(change.requiredMode === undefined
              ? {}
              : { mode: change.requiredMode }),
            ...(change.required === undefined
              ? {}
              : { actions: change.required }),
          },
        }
      : {}),
  };
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
  keptExceptions,
}: {
  current: PieceSelection;
  include: boolean;
  knownPieceNames: string[];
  keptExceptions: string[];
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
    exceptions: unique([
      ...knownPieceNames.filter((name) => !listed.has(name)),
      ...keptExceptions,
    ]),
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

export const pieceSetChanges = {
  apply,
  toRequest,
  inverse,
  excludedRequiredActions,
  isActionAllowed,
  countRequiredActions,
};

export type PieceSetChange =
  | { type: 'visibility'; visible: Record<string, boolean>; label?: string }
  | {
      type: 'newPieces';
      include: boolean;
      knownPieceNames: string[];
      keptExceptions?: string[];
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
  | {
      type: 'patch';
      visible?: Record<string, boolean>;
      actions?: Record<string, ComponentSelection>;
      triggers?: Record<string, ComponentSelection>;
      required?: Record<string, string[]>;
      requiredMode?: RequiredActionsMode;
    };

export type ChangePieceSet = (change: PieceSetChange) => Promise<boolean>;
