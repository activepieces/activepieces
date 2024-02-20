import { Action, createReducer, on } from '@ngrx/store';

import {
  CanvasState,
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
import { FlowsActions } from '../../flow/flow.action';

const initialState: CanvasState = {
  selectedRun: undefined,
  leftSidebar: {
    type: LeftSideBarType.NONE,
  },
  rightSidebar: {
    type: RightSideBarType.NONE,
    props: NO_PROPS,
  },
  selectedStepName: 'initialVal',
  viewedVersion: {
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
    const displayedFlowVersion = JSON.parse(
      JSON.stringify(action.displayedFlowVersion)
    );

    return {
      ...initialState,
      viewedVersion: displayedFlowVersion,
      selectedRun: action.run,
    };
  }),
  on(canvasActions.viewVersion, (state, action): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    return {
      ...clonedState,
      viewedVersion: action.viewedFlowVersion,
      selectedStepName: '',
      clickedAddBtnId: undefined,
      selectedRun: undefined,
      rightSidebar: {
        props: NO_PROPS,
        type: RightSideBarType.NONE,
      },
      leftSidebar: {
        type: LeftSideBarType.NONE,
      },
    };
  }),
  on(canvasActions.updateViewedVersionId, (state, action): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    clonedState.viewedVersion.id = action.versionId;
    return clonedState;
  }),
  on(canvasActions.deselectStep, (state): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    return {
      ...clonedState,
      selectedStepName: '',
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
    if (clonedState.viewedVersion) {
      return {
        ...clonedState,
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
  on(canvasActions.setRun, (state, { run }): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    clonedState.selectedRun = run;
    return clonedState;
  }),
  on(canvasActions.exitRun, (state, { flowVersion }): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    return {
      ...clonedState,
      selectedRun: undefined,
      leftSidebar: {
        type: LeftSideBarType.NONE,
      },
      selectedStepName: '',
      rightSidebar: {
        props: NO_PROPS,
        type: RightSideBarType.NONE,
      },
      clickedAddBtnId: undefined,
      viewedVersion: flowVersion,
    };
  }),
  on(FlowsActions.updateAction, (state, { operation }): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    clonedState.viewedVersion = flowHelper.apply(clonedState.viewedVersion, {
      type: FlowOperationType.UPDATE_ACTION,
      request: operation,
    });
    clonedState.selectedStepName = operation.name;
    return clonedState;
  }),
  on(FlowsActions.addAction, (state, { operation }): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    clonedState.viewedVersion = flowHelper.apply(clonedState.viewedVersion, {
      type: FlowOperationType.ADD_ACTION,
      request: operation,
    });
    return clonedState;
  }),

  on(FlowsActions.duplicateStep, (state, { operation }): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    const clonedFlowVersionWithArtifacts: FlowVersion = JSON.parse(
      JSON.stringify(operation.flowVersionWithArtifacts)
    );
    const newStepName = flowHelper.findAvailableStepName(
      state.viewedVersion,
      'step'
    );

    clonedState.viewedVersion = flowHelper.apply(
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
      selectedStepName: newStepName,
      rightSidebar: {
        type: RightSideBarType.EDIT_STEP,
        props: 'NO_PROPS',
      },
    };
  }),
  on(FlowsActions.updateTrigger, (state, { operation }): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    clonedState.viewedVersion = flowHelper.apply(clonedState.viewedVersion, {
      type: FlowOperationType.UPDATE_TRIGGER,
      request: operation,
    });
    clonedState.selectedStepName = operation.name;
    return clonedState;
  }),
  on(FlowsActions.deleteAction, (state, { operation }): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    clonedState.viewedVersion = flowHelper.apply(clonedState.viewedVersion, {
      type: FlowOperationType.DELETE_ACTION,
      request: operation,
    });
    return clonedState;
  }),
  on(FlowsActions.moveAction, (state, { operation }): CanvasState => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    clonedState.viewedVersion = flowHelper.apply(clonedState.viewedVersion, {
      type: FlowOperationType.MOVE_ACTION,
      request: operation,
    });
    return clonedState;
  }),
  on(FlowsActions.importFlow, (state, { flow }) => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    clonedState.viewedVersion = flow.version;
    clonedState.leftSidebar = {
      type: LeftSideBarType.NONE,
    };
    clonedState.rightSidebar = {
      props: NO_PROPS,
      type: RightSideBarType.NONE,
    };
    clonedState.selectedStepName = '';
    clonedState.clickedAddBtnId = undefined;
    clonedState.selectedRun = undefined;
    return clonedState;
  }),
  on(canvasActions.setAddButtonId, (state, { id }) => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    clonedState.clickedAddBtnId = id;
    return clonedState;
  }),
  on(canvasActions.viewRun, (state, { run, version }) => {
    const clonedState: CanvasState = JSON.parse(JSON.stringify(state));
    clonedState.selectedRun = run;
    clonedState.viewedVersion = version;
    clonedState.leftSidebar = {
      type: LeftSideBarType.SHOW_RUN,
    };
    clonedState.selectedStepName = '';
    clonedState.clickedAddBtnId = undefined;
    clonedState.rightSidebar = {
      props: NO_PROPS,
      type: RightSideBarType.NONE,
    };
    return clonedState;
  })
);

export function canvasReducer(state: CanvasState | undefined, action: Action) {
  return __CanvasReducer(state, action);
}
