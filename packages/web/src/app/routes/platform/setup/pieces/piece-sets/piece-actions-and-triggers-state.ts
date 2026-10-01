import { PieceSet, UpdatePieceSetRequestBody } from '@activepieces/shared';

function init({
  pieceSet,
  pieceName,
  actionNames,
  triggerNames,
}: {
  pieceSet: PieceSet;
  pieceName: string;
  actionNames: string[];
  triggerNames: string[];
}): PieceActionsAndTriggersState {
  const { selectedActions, selectedTriggers } = pieceSet.config;
  const mode: VisibilityMode =
    pieceName in selectedActions || pieceName in selectedTriggers
      ? 'selected'
      : 'all';
  return {
    actionNames,
    triggerNames,
    mode,
    selectedActions: pickSelected({
      mode,
      names: actionNames,
      saved: selectedActions[pieceName],
    }),
    selectedTriggers: pickSelected({
      mode,
      names: triggerNames,
      saved: selectedTriggers[pieceName],
    }),
  };
}

function reduce(
  state: PieceActionsAndTriggersState,
  event: PieceActionsAndTriggersEvent,
): PieceActionsAndTriggersState {
  switch (event.type) {
    case 'setMode':
      return { ...state, mode: event.mode };
    case 'toggleAction':
      return {
        ...state,
        selectedActions: toggleName({
          names: state.selectedActions,
          name: event.name,
        }),
      };
    case 'toggleTrigger':
      return {
        ...state,
        selectedTriggers: toggleName({
          names: state.selectedTriggers,
          name: event.name,
        }),
      };
    case 'toggleSelectAll': {
      if (isEverythingSelected(state)) {
        return { ...state, selectedActions: [], selectedTriggers: [] };
      }
      return {
        ...state,
        selectedActions: state.actionNames,
        selectedTriggers: state.triggerNames,
      };
    }
  }
}

function isEverythingSelected(state: PieceActionsAndTriggersState): boolean {
  return (
    state.selectedActions.length === state.actionNames.length &&
    state.selectedTriggers.length === state.triggerNames.length
  );
}

function toUpdateRequest({
  state,
  pieceName,
}: {
  state: PieceActionsAndTriggersState;
  pieceName: string;
}): UpdatePieceSetRequestBody {
  if (state.mode === 'all') {
    return {
      actions: { [pieceName]: { mode: 'all' } },
      triggers: { [pieceName]: { mode: 'all' } },
    };
  }
  return {
    actions: {
      [pieceName]: { mode: 'selected', selected: state.selectedActions },
    },
    triggers: {
      [pieceName]: { mode: 'selected', selected: state.selectedTriggers },
    },
  };
}

function pickSelected({
  mode,
  names,
  saved,
}: {
  mode: VisibilityMode;
  names: string[];
  saved: string[] | undefined;
}): string[] {
  if (mode === 'all') {
    return names;
  }
  return names.filter((name) => saved?.includes(name));
}

function toggleName({
  names,
  name,
}: {
  names: string[];
  name: string;
}): string[] {
  return names.includes(name)
    ? names.filter((existingName) => existingName !== name)
    : [...names, name];
}

export const pieceActionsAndTriggersState = {
  init,
  reduce,
  toUpdateRequest,
};

export type VisibilityMode = 'all' | 'selected';

export type PieceActionsAndTriggersState = {
  actionNames: string[];
  triggerNames: string[];
  mode: VisibilityMode;
  selectedActions: string[];
  selectedTriggers: string[];
};

export type PieceActionsAndTriggersEvent =
  | { type: 'setMode'; mode: VisibilityMode }
  | { type: 'toggleAction'; name: string }
  | { type: 'toggleTrigger'; name: string }
  | { type: 'toggleSelectAll' };
