import { Action, createReducer, on } from '@ngrx/store';
import { FlowsActions } from './flows.action';
import {
  flowHelper,
  FlowInstanceStatus,
  FlowOperationType,
  FlowVersionState,
  TriggerType,
} from '@activepieces/shared';
import { LeftSideBarType } from '../../model/enums/left-side-bar-type.enum';
import { RightSideBarType } from '../../model/enums/right-side-bar-type.enum';
import { NO_PROPS } from '../../model/builder-state';
import { FlowItem } from '../../model/flow-item';
import { BuilderSavingStatusEnum } from '../../model';
import { FlowState } from '../../model/flow-state';
import { FlowInstanceActions } from '../builder/flow-instance/flow-instance.action';

const initialState: FlowState = {
  flow: {
    status: FlowInstanceStatus.UNPUBLISHED,
    projectId: '1',
    id: '1',
    updated: '',
    created: '',
    version: {
      flowId: '1',
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
  },
  folder: undefined,
  builderState: {
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
  },
  savingStatus: BuilderSavingStatusEnum.NONE,
  lastSaveId: '161f8c09-dea1-470e-8a90-5666a8f17bd4',
};

const _flowsReducer = createReducer(
  initialState,
  on(FlowsActions.setInitial, (state, { flow, run, folder }): FlowState => {
    return {
      flow: flow,
      folder: folder,
      builderState: {
        selectedRun: run,
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
      },
      savingStatus: BuilderSavingStatusEnum.NONE,
      lastSaveId: '161f8c09-dea1-470e-8a90-5666a8f17bd4',
    };
  }),
  on(FlowsActions.updateTrigger, (state, { operation }): FlowState => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.flow.version = flowHelper.apply(clonedState.flow.version, {
      type: FlowOperationType.UPDATE_TRIGGER,
      request: operation,
    });
    if (operation.name === state.builderState.focusedStep?.name) {
      clonedState.builderState.focusedStep = operation;
    }
    clonedState.builderState = {
      ...clonedState.builderState,
      focusedStep: clonedState.flow.version?.trigger as FlowItem,
    };
    return clonedState;
  }),
  on(FlowsActions.addAction, (state, { operation }): FlowState => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.flow.version = flowHelper.apply(clonedState.flow.version, {
      type: FlowOperationType.ADD_ACTION,
      request: operation,
    });
    clonedState.builderState = {
      ...clonedState.builderState,
    };
    return clonedState;
  }),
  on(FlowsActions.updateAction, (state, { operation }): FlowState => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.flow.version = flowHelper.apply(clonedState.flow.version, {
      type: FlowOperationType.UPDATE_ACTION,
      request: operation,
    });
    if (operation.name === state.builderState.focusedStep?.name) {
      clonedState.builderState.focusedStep = operation;
    }
    clonedState.builderState = {
      ...clonedState.builderState,
    };
    return clonedState;
  }),
  on(FlowsActions.deleteAction, (state, { operation }): FlowState => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.flow.version = flowHelper.apply(clonedState.flow.version, {
      type: FlowOperationType.DELETE_ACTION,
      request: operation,
    });
    clonedState.builderState = {
      ...clonedState.builderState,
    };
    return clonedState;
  }),
  on(FlowsActions.moveAction, (state, { operation }) => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.flow.version = flowHelper.apply(clonedState.flow.version, {
      type: FlowOperationType.MOVE_ACTION,
      request: operation,
    });
    return clonedState;
  }),
  on(FlowsActions.changeName, (state, { displayName }): FlowState => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.flow.version.displayName = displayName;
    return clonedState;
  }),
  on(FlowsActions.savedSuccess, (state, { flow }): FlowState => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.flow.version.id = flow.version.id;
    clonedState.flow.version.state = flow.version.state;
    return clonedState;
  }),
  on(FlowsActions.setLeftSidebar, (state, { sidebarType }): FlowState => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    return {
      ...clonedState,
      builderState: {
        ...clonedState.builderState,
        leftSidebar: {
          type: sidebarType,
        },
      },
    };
  }),
  on(FlowsActions.setRun, (state, { run }): FlowState => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.builderState.selectedRun = run;
    return clonedState;
  }),
  on(FlowsActions.exitRun, (state): FlowState => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.builderState = {
      ...clonedState.builderState,
      selectedRun: undefined,
    };
    return clonedState;
  }),
  on(FlowsActions.deselectStep, (state): FlowState => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.builderState = {
      ...clonedState.builderState,
      focusedStep: undefined,
    };
    return clonedState;
  }),
  on(
    FlowsActions.setRightSidebar,
    (state, { sidebarType, props }): FlowState => {
      const clonedState: FlowState = JSON.parse(JSON.stringify(state));
      clonedState.builderState.rightSidebar = {
        type: sidebarType,
        props: props,
      };
      return clonedState;
    }
  ),
  on(FlowsActions.selectStepByName, (flowState, { stepName }) => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(flowState));
    if (clonedState.flow) {
      const step: FlowItem | undefined = flowHelper.getStep(
        clonedState.flow.version,
        stepName
      );
      clonedState.builderState = {
        ...clonedState.builderState,
        focusedStep: step,
      };
    }
    return clonedState;
  }),
  on(FlowsActions.applyUpdateOperation, (flowState, action) => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(flowState));
    clonedState.lastSaveId = action.saveRequestId;
    clonedState.savingStatus |= BuilderSavingStatusEnum.SAVING_FLOW;
    return clonedState;
  }),
  on(FlowsActions.savedSuccess, (state, action) => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    if (action.saveRequestId === clonedState.lastSaveId) {
      clonedState.savingStatus &= ~BuilderSavingStatusEnum.SAVING_FLOW;
    }
    return clonedState;
  }),
  on(FlowsActions.savedFailed, (state) => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.savingStatus =
      BuilderSavingStatusEnum.FAILED_SAVING_OR_PUBLISHING;
    return clonedState;
  }),
  on(FlowInstanceActions.publish, (state) => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.savingStatus |= BuilderSavingStatusEnum.PUBLISHING;
    return clonedState;
  }),
  on(FlowInstanceActions.publishSuccess, (state) => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.savingStatus &= ~BuilderSavingStatusEnum.PUBLISHING;
    return clonedState;
  }),
  on(FlowInstanceActions.publishFailed, (state) => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.savingStatus =
      BuilderSavingStatusEnum.FAILED_SAVING_OR_PUBLISHING;
    return clonedState;
  }),
  on(FlowsActions.generateFlowSuccessful, (state, action) => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    return {
      ...clonedState,
      builderState: {
        ...clonedState.builderState,
        isGeneratingFlowComponentOpen: false,
      },
      flow: action.flow,
    };
  }),
  on(FlowsActions.openGenerateFlowComponent, (state) => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    return {
      ...clonedState,
      builderState: {
        ...clonedState.builderState,
        leftSidebar: {
          type: LeftSideBarType.NONE,
        },
        rightSidebar: {
          type: RightSideBarType.NONE,
          props: 'NO_PROPS',
        },
        isGeneratingFlowComponentOpen: true,
        selectedRun: undefined,
      },
    };
  }),
  on(FlowsActions.closeGenerateFlowComponent, (state) => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    return {
      ...clonedState,
      builderState: {
        ...clonedState.builderState,
        isGeneratingFlowComponentOpen: false,
      },
    };
  })
);
export function flowsReducer(state: FlowState | undefined, action: Action) {
  return _flowsReducer(state, action);
}
