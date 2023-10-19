import { Action, createReducer, on } from '@ngrx/store';

import {
  CanvasState,
  FlowItem,
  LeftSideBarType,
  NO_PROPS,
  RightSideBarType,
} from '../../../model';
import {
  FlowOperationType,
  FlowVersion,
  FlowVersionState,
  TriggerType,
  flowHelper,
} from '@activepieces/shared';
import { canvasActions } from './canvas.action';
import { FlowsActions } from '../../flow/flows.action';

const initialState: CanvasState = {
  selectedRun: undefined,
  leftSidebar: {
    type: LeftSideBarType.NONE,
  },
  rightSidebar: {
    type: RightSideBarType.NONE,
    props: NO_PROPS,
  },
  focusedStep: undefined,
  selectedStepName: 'initialVal',
  isGeneratingFlowComponentOpen: false,
  displayedFlowVersion: {
    flowId: '1',
    updatedBy: '',
    displayName: 'Flow version',
    valid: false,
    updated: '',
    created: '',
    id: '',
    trigger: {
      name: 'empty',
      valid: false,
      displayName: 'Empty Trigger',
      type: TriggerType.EMPTY,
      settings: {},
    },
    state: FlowVersionState.DRAFT,
  },
};

const __CanvasReducer = createReducer(
  initialState,
  on(canvasActions.setInitial, (state, action): CanvasState => {
    return {
      ...initialState,
      displayedFlowVersion: action.displayedFlowVersion,
      selectedRun: action.run,
    };
  }),
  on(canvasActions.deselectStep, (state): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    return {
      ...clonedState,
      focusedStep: undefined,
    };
  }),
  on(
    canvasActions.setRightSidebar,
    (state, { sidebarType, props }): CanvasState => {
      const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
      clonedState.rightSidebar = {
        type: sidebarType,
        props: props,
      };
      return clonedState;
    }
  ),
  on(canvasActions.selectStepByName, (state, { stepName }) => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    if (clonedState.displayedFlowVersion) {
      const step: FlowItem | undefined = flowHelper.getStep(
        clonedState.displayedFlowVersion,
        stepName
      );
      return {
        ...clonedState,
        focusedStep: step,
        selectedStepName: stepName,
      };
    }
    return clonedState;
  }),
  on(canvasActions.setLeftSidebar, (state, { sidebarType }): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    return {
      ...clonedState,
      leftSidebar: {
        type: sidebarType,
      },
    };
  }),
  on(canvasActions.openGenerateFlowComponent, (state): CanvasState => {
    return {
      ...state,
      leftSidebar: {
        type: LeftSideBarType.NONE,
      },
      rightSidebar: {
        type: RightSideBarType.NONE,
        props: 'NO_PROPS',
      },
      isGeneratingFlowComponentOpen: true,
      selectedRun: undefined,
    };
  }),
  on(canvasActions.setRun, (state, { run }): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    clonedState.selectedRun = run;
    return clonedState;
  }),
  on(canvasActions.exitRun, (state): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    return {
      ...clonedState,
      selectedRun: undefined,
    };
  }),
  on(canvasActions.closeGenerateFlowComponent, (state): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    return {
      ...clonedState,
      isGeneratingFlowComponentOpen: false,
    };
  }),
  on(canvasActions.generateFlowSuccessful, (state, action): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    return {
      ...clonedState,
      displayedFlowVersion: action.flow.version,
    };
  }),
  on(FlowsActions.updateAction, (state, { operation }): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    clonedState.displayedFlowVersion = flowHelper.apply(
      clonedState.displayedFlowVersion,
      {
        type: FlowOperationType.UPDATE_ACTION,
        request: operation,
      }
    );
    if (operation.name === state.focusedStep?.name) {
      clonedState.focusedStep = operation;
    }
    return clonedState;
  }),
  on(FlowsActions.addAction, (state, { operation }): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    clonedState.displayedFlowVersion = flowHelper.apply(
      clonedState.displayedFlowVersion,
      {
        type: FlowOperationType.ADD_ACTION,
        request: operation,
      }
    );
    return clonedState;
  }),
  on(FlowsActions.duplicateStep, (state, { operation }): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    const clonedFlowVersionWithArtifacts: FlowVersion = JSON.parse(
      JSON.stringify(operation.flowVersionWithArtifacts)
    );
    const newStepName = flowHelper.findAvailableStepName(
      state.displayedFlowVersion,
      'step'
    );

    clonedState.displayedFlowVersion = flowHelper.apply(
      clonedFlowVersionWithArtifacts,
      {
        type: FlowOperationType.DUPLICATE_ACTION,
        request: {
          stepName: operation.originalStepName,
        },
      }
    );
    return {
      ...clonedState,
      focusedStep: flowHelper.getStep(
        clonedState.displayedFlowVersion,
        newStepName
      ),
      rightSidebar: {
        type: RightSideBarType.EDIT_STEP,
        props: 'NO_PROPS',
      },
    };
  }),
  on(FlowsActions.updateTrigger, (state, { operation }): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    clonedState.displayedFlowVersion = flowHelper.apply(
      clonedState.displayedFlowVersion,
      {
        type: FlowOperationType.UPDATE_TRIGGER,
        request: operation,
      }
    );
    if (operation.name === state.focusedStep?.name) {
      clonedState.focusedStep = operation;
    }
    return clonedState;
  }),
  on(FlowsActions.deleteAction, (state, { operation }): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    clonedState.displayedFlowVersion = flowHelper.apply(
      clonedState.displayedFlowVersion,
      {
        type: FlowOperationType.DELETE_ACTION,
        request: operation,
      }
    );
    clonedState.focusedStep = undefined;
    return clonedState;
  }),
  on(FlowsActions.moveAction, (state, { operation }): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    clonedState.displayedFlowVersion = flowHelper.apply(
      clonedState.displayedFlowVersion,
      {
        type: FlowOperationType.MOVE_ACTION,
        request: operation,
      }
    );
    return clonedState;
  }),
  on(FlowsActions.importFlow, (state, { flow }) => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    clonedState.displayedFlowVersion = flow.version;
    return clonedState;
  }),
  on(canvasActions.setAddButtonId, (state, { id }) => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    clonedState.clickedAddBtnId = id;
    return clonedState;
  })
);

export function canvasReducer(state: CanvasState | undefined, action: Action) {
  return __CanvasReducer(state, action);
}
