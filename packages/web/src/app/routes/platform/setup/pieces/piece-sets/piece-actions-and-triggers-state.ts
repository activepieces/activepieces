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
  const { selectedActions, selectedTriggers, requiredActions } =
    pieceSet.config;
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
    requiredActions: requiredActions.actions[pieceName] ?? [],
  };
}

function reduce(
  state: PieceActionsAndTriggersState,
  event: PieceActionsAndTriggersEvent,
): PieceActionsAndTriggersState {
  switch (event.type) {
    case 'setMode':
      return { ...state, mode: event.mode };
    case 'toggleAction': {
      if (!state.selectedActions.includes(event.name)) {
        return {
          ...state,
          selectedActions: addNames({
            names: state.selectedActions,
            namesToAdd: [event.name],
          }),
        };
      }
      return {
        ...state,
        selectedActions: removeName({
          names: state.selectedActions,
          nameToRemove: event.name,
        }),
        requiredActions: removeName({
          names: state.requiredActions,
          nameToRemove: event.name,
        }),
      };
    }
    case 'toggleTrigger':
      return {
        ...state,
        selectedTriggers: state.selectedTriggers.includes(event.name)
          ? removeName({
              names: state.selectedTriggers,
              nameToRemove: event.name,
            })
          : addNames({
              names: state.selectedTriggers,
              namesToAdd: [event.name],
            }),
      };
    case 'toggleRequired': {
      if (state.requiredActions.includes(event.name)) {
        return {
          ...state,
          requiredActions: removeName({
            names: state.requiredActions,
            nameToRemove: event.name,
          }),
        };
      }
      return {
        ...state,
        requiredActions: addNames({
          names: state.requiredActions,
          namesToAdd: [event.name],
        }),
        selectedActions: addNames({
          names: state.selectedActions,
          namesToAdd: [event.name],
        }),
      };
    }
    case 'toggleSelectAll': {
      if (isEverythingSelected(state)) {
        return {
          ...state,
          selectedActions: [],
          selectedTriggers: [],
          requiredActions: [],
        };
      }
      return {
        ...state,
        selectedActions: state.actionNames,
        selectedTriggers: state.triggerNames,
      };
    }
    case 'toggleAllRequired': {
      const actionNamesInSet = findActionNamesInSet(state);
      if (areAllRequired(state)) {
        return { ...state, requiredActions: [] };
      }
      return {
        ...state,
        requiredActions: actionNamesInSet,
        selectedActions: addNames({
          names: state.selectedActions,
          namesToAdd: actionNamesInSet,
        }),
      };
    }
  }
}

function findActionNamesInSet(state: PieceActionsAndTriggersState): string[] {
  return state.mode === 'all' ? state.actionNames : state.selectedActions;
}

function areAllRequired(state: PieceActionsAndTriggersState): boolean {
  const actionNamesInSet = findActionNamesInSet(state);
  return (
    actionNamesInSet.length > 0 &&
    actionNamesInSet.every((name) => state.requiredActions.includes(name))
  );
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
  const requiredActions = { actions: { [pieceName]: state.requiredActions } };
  if (state.mode === 'all') {
    return {
      actions: { [pieceName]: { mode: 'all' } },
      triggers: { [pieceName]: { mode: 'all' } },
      requiredActions,
    };
  }
  return {
    actions: {
      [pieceName]: { mode: 'selected', selected: state.selectedActions },
    },
    triggers: {
      [pieceName]: { mode: 'selected', selected: state.selectedTriggers },
    },
    requiredActions,
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

function removeName({
  names,
  nameToRemove,
}: {
  names: string[];
  nameToRemove: string;
}): string[] {
  return names.filter((name) => name !== nameToRemove);
}

function addNames({
  names,
  namesToAdd,
}: {
  names: string[];
  namesToAdd: string[];
}): string[] {
  return [...names, ...namesToAdd.filter((name) => !names.includes(name))];
}

export const pieceActionsAndTriggersState = {
  init,
  reduce,
  toUpdateRequest,
  findActionNamesInSet,
  areAllRequired,
};

export type VisibilityMode = 'all' | 'selected';

export type PieceActionsAndTriggersState = {
  actionNames: string[];
  triggerNames: string[];
  mode: VisibilityMode;
  selectedActions: string[];
  selectedTriggers: string[];
  requiredActions: string[];
};

export type PieceActionsAndTriggersEvent =
  | { type: 'setMode'; mode: VisibilityMode }
  | { type: 'toggleAction'; name: string }
  | { type: 'toggleTrigger'; name: string }
  | { type: 'toggleRequired'; name: string }
  | { type: 'toggleSelectAll' }
  | { type: 'toggleAllRequired' };
