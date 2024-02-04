import { Action, createReducer, on } from '@ngrx/store';
import { FlowsActions } from './flow.action';
import {
  flowHelper,
  FlowStatus,
  FlowOperationType,
  FlowVersionState,
  TriggerType,
} from '@activepieces/shared';
import { BuilderSavingStatusEnum, ViewModeEnum } from '../../model';
import { FlowState } from '../../model/flow-state';
import { ViewModeActions } from '../builder/viewmode/view-mode.action';

const initialState: FlowState = {
  flow: {
    publishedVersionId: null,
    schedule: null,
    status: FlowStatus.DISABLED,
    projectId: '1',
    folderId: null,
    id: '1',
    updated: '',
    created: '',
    version: {
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
    publishedFlowVersion: undefined,
  },

  savingStatus: BuilderSavingStatusEnum.NONE,
  lastSaveId: '161f8c09-dea1-470e-8a90-5666a8f17bd4',
};

const _flowsReducer = createReducer(
  initialState,
  on(FlowsActions.setInitial, (state, { type, flow }): FlowState => {
    const newState: FlowState = {
      flow: flow,
      savingStatus: BuilderSavingStatusEnum.NONE,
      lastSaveId: '161f8c09-dea1-470e-8a90-5666a8f17bd4',
    };
    return newState;
  }),
  on(FlowsActions.updateTrigger, (state, { operation }): FlowState => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.flow.version = flowHelper.apply(clonedState.flow.version, {
      type: FlowOperationType.UPDATE_TRIGGER,
      request: operation,
    });
    return clonedState;
  }),
  on(FlowsActions.addAction, (state, { operation }): FlowState => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.flow.version = flowHelper.apply(clonedState.flow.version, {
      type: FlowOperationType.ADD_ACTION,
      request: operation,
    });
    return clonedState;
  }),
  on(FlowsActions.duplicateStep, (state, { operation }): FlowState => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    const clonedFlowVersionWithArtifacts = JSON.parse(
      JSON.stringify(operation.flowVersionWithArtifacts)
    );
    clonedState.flow.version = flowHelper.apply(
      clonedFlowVersionWithArtifacts,
      {
        type: FlowOperationType.DUPLICATE_ACTION,
        request: {
          stepName: operation.originalStepName,
        },
      }
    );
    return clonedState;
  }),
  on(FlowsActions.updateAction, (state, { operation }): FlowState => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.flow.version = flowHelper.apply(clonedState.flow.version, {
      type: FlowOperationType.UPDATE_ACTION,
      request: operation,
    });
    return clonedState;
  }),
  on(FlowsActions.deleteAction, (state, { operation }): FlowState => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.flow.version = flowHelper.apply(clonedState.flow.version, {
      type: FlowOperationType.DELETE_ACTION,
      request: operation,
    });
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
  on(FlowsActions.applyUpdateOperation, (flowState, action) => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(flowState));
    clonedState.lastSaveId = action.saveRequestId;
    clonedState.flow.version.state = FlowVersionState.DRAFT;
    clonedState.savingStatus |= BuilderSavingStatusEnum.SAVING_FLOW;
    clonedState.savingStatus &= ~BuilderSavingStatusEnum.WAITING_TO_SAVE;
    return clonedState;
  }),
  on(ViewModeActions.setViewMode, (flowState, action) => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(flowState));
    if (action.viewMode === ViewModeEnum.BUILDING) {
      clonedState.flow.version.state = FlowVersionState.DRAFT;
    }
    return clonedState;
  }),
  on(FlowsActions.savedSuccess, (state, action) => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.flow.version.state = FlowVersionState.DRAFT;
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
  on(FlowsActions.publish, (state) => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.savingStatus |= BuilderSavingStatusEnum.PUBLISHING;

    return clonedState;
  }),
  on(FlowsActions.publishSuccess, (state, { publishedFlowVersionId }) => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.flow.publishedFlowVersion = JSON.parse(
      JSON.stringify(state.flow.version)
    );
    clonedState.flow.publishedVersionId = publishedFlowVersionId;
    clonedState.flow.version.state = FlowVersionState.LOCKED;
    clonedState.savingStatus &= ~BuilderSavingStatusEnum.PUBLISHING;
    clonedState.flow.status = FlowStatus.ENABLED;
    return clonedState;
  }),
  on(FlowsActions.publishFailed, (state) => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.savingStatus =
      BuilderSavingStatusEnum.FAILED_SAVING_OR_PUBLISHING;
    return clonedState;
  }),
  on(FlowsActions.importFlow, (state, { flow }) => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));

    if (state.flow.publishedFlowVersion) {
      clonedState.flow = {
        ...flow,
        publishedFlowVersion: JSON.parse(
          JSON.stringify(state.flow.publishedFlowVersion)
        ),
        publishedVersionId: state.flow.publishedVersionId,
      };
    } else {
      clonedState.flow = {
        ...flow,
        publishedVersionId: state.flow.publishedVersionId,
      };
    }

    return clonedState;
  }),
  on(FlowsActions.toggleWaitingToSave, (state) => {
    const clonedState: FlowState = JSON.parse(JSON.stringify(state));
    clonedState.savingStatus |= BuilderSavingStatusEnum.WAITING_TO_SAVE;
    return clonedState;
  })
);
export function flowsReducer(state: FlowState | undefined, action: Action) {
  return _flowsReducer(state, action);
}
