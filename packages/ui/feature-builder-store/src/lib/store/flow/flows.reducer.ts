import { Action, createReducer, on } from '@ngrx/store';
import { FlowsActions } from './flows.action';
import {
  Flow,
  flowHelper,
  FlowInstanceStatus,
  FlowOperationType,
  FlowVersionState,
  TriggerType,
} from '@activepieces/shared';
import { LeftSideBarType } from '../../model/enums/left-side-bar-type.enum';
import { RightSideBarType } from '../../model/enums/right-side-bar-type.enum';
import { NO_PROPS, BuilderState } from '../../model/builder-state';
import { FlowItem } from '../../model/flow-item';

type FlowsState = {
  flow: Flow;
  builderState: BuilderState;
};

const initialState: FlowsState = {
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
    folderDisplayName:'Uncategorized'
  },
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
  },
};

const _flowsReducer = createReducer(
  initialState,
  on(FlowsActions.setInitial, (state, { flow, run }): FlowsState => {
    return {
      flow: flow,
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
      },
    };
  }),
  on(FlowsActions.updateTrigger, (state, { operation }): FlowsState => {
    const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
    clonedState.flow.version = flowHelper.apply(clonedState.flow.version, {
      type: FlowOperationType.UPDATE_TRIGGER,
      request: operation,
    });
    clonedState.builderState = {
      ...clonedState.builderState,
      focusedStep: clonedState.flow.version?.trigger as FlowItem,
    };
    return clonedState;
  }),
  on(FlowsActions.addAction, (state, { operation }): FlowsState => {
    const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
    clonedState.flow.version = flowHelper.apply(clonedState.flow.version, {
      type: FlowOperationType.ADD_ACTION,
      request: operation,
    });
    clonedState.builderState = {
      ...clonedState.builderState,
    };
    return clonedState;
  }),
  on(FlowsActions.updateAction, (state, { operation }): FlowsState => {
    const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
    clonedState.flow.version = flowHelper.apply(clonedState.flow.version, {
      type: FlowOperationType.UPDATE_ACTION,
      request: operation,
    });
    clonedState.builderState = {
      ...clonedState.builderState,
    };
    return clonedState;
  }),
  on(FlowsActions.deleteAction, (state, { operation }): FlowsState => {
    const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
    clonedState.flow.version = flowHelper.apply(clonedState.flow.version, {
      type: FlowOperationType.DELETE_ACTION,
      request: operation,
    });
    clonedState.builderState = {
      ...clonedState.builderState,
    };
    return clonedState;
  }),
  on(FlowsActions.changeName, (state, { displayName }): FlowsState => {
    const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
    clonedState.flow.version.displayName = displayName;
    return clonedState;
  }),
  on(
    FlowsActions.savedSuccess,
    (state, { saveRequestId, flow }): FlowsState => {
      const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
      clonedState.flow.version.id = flow.version.id;
      clonedState.flow.version.state = flow.version.state;
      return clonedState;
    }
  ),
  on(FlowsActions.setLeftSidebar, (state, { sidebarType }): FlowsState => {
    const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
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
  on(FlowsActions.setRun, (state, { run }): FlowsState => {
    const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
    clonedState.builderState.selectedRun = run;
    return clonedState;
  }),
  on(FlowsActions.exitRun, (state): FlowsState => {
    const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
    clonedState.builderState = {
      ...clonedState.builderState,
      selectedRun: undefined,
    };
    return clonedState;
  }),
  on(FlowsActions.deselectStep, (state): FlowsState => {
    const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
    clonedState.builderState = {
      ...clonedState.builderState,
      focusedStep: undefined,
    };
    return clonedState;
  }),
  on(
    FlowsActions.setRightSidebar,
    (state, { sidebarType, props }): FlowsState => {
      const clonedState: FlowsState = JSON.parse(JSON.stringify(state));
      clonedState.builderState.rightSidebar = {
        type: sidebarType,
        props: props,
      };
      return clonedState;
    }
  ),
  on(FlowsActions.selectStepByName, (flowsState, { stepName }) => {
    const clonedState: FlowsState = JSON.parse(JSON.stringify(flowsState));
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
  })
);
export function flowsReducer(state: FlowsState | undefined, action: Action) {
  return _flowsReducer(state, action);
}
