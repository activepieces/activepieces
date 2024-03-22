import { createAction, props } from '@ngrx/store';
import { UUID } from 'angular2-uuid';
import {
  AddActionRequest,
  PopulatedFlow,
  DeleteActionRequest,
  UpdateActionRequest,
  UpdateTriggerRequest,
  FlowRun,
  FlowOperationRequest,
  Folder,
  MoveActionRequest,
  FlowVersion,
  FlowStatus,
  ApId,
} from '@activepieces/shared';
import { PiecePropertyMap } from '@activepieces/pieces-framework';

export enum FlowsActionType {
  // Flow Version Modifying Action
  UPDATE_TRIGGER = '[FLOWS] UPDATE_TRIGGER',
  CHANGE_NAME = '[FLOWS] CHANGE_NAME',
  ADD_ACTION = '[FLOWS] ADD_ACTION',
  DELETE_ACTION = '[FLOWS] DELETE_ACTION',
  UPDATE_ACTION = '[FLOWS] UPDATE_ACTION',
  SET_INITIAL = '[FLOWS] SET_INITIAL',
  SAVED_FAILED = '[FLOWS] SAVED_FAILED',
  SAVED_SUCCESS = '[FLOWS] SAVED_SUCCESS',
  APPLY_UPDATE_OPERATION = '[FLOWS] APPLY_UPDATE_OPERATION',
  DESELECT_STEP = '[FLOWS] DESELECT_STEP',
  SELECT_FIRST_INVALID_STEP = '[FLOWS] SELECT_FIRST_INVALID_STEP',
  MOVE_ACTION = '[FLOWS] MOVE_ACTION',
  IMPORT_FLOW = '[FLOWS] IMPORT_FLOW',
  TOGGLE_WAITING_TO_SAVE = '[FLOWS] TOGGLE_WAITING_TO_SAVE',
  DUPLICATE_ACTION = `[FLOWS] DUPLICATE_ACTION`,
  PUBLISH_FLOW = '[FLOWS] PUBLISH_FLOW',
  PUBLISH_FLOW_FAILED = '[FLOWS] PUBLISH_FLOW_FAILED',
  PUBLISH_FLOW_SUCCESS = '[FLOWS] PUBLISH_FLOW_SUCCESS',
  DISABLE_INSTANCE = '[FLOWS] DISABLE_FLOW',
  ENABLE_INSTANCE = `[FLOWS] ENABLE_FLOW`,
  UPDATE_INSTANCE_STATUS_SUCCESS = `[FLOWS] UPDATE_STATUS_SUCCESS`,
  NEW_TRIGGER_OR_ACTION_SELECTED = `[FLOWS] NEW_TRIGGER_OR_ACTION_SELECTED`,
}

const updateTrigger = createAction(
  FlowsActionType.UPDATE_TRIGGER,
  props<{ operation: UpdateTriggerRequest }>()
);
const newTriggerOrActionSelected = createAction(
  FlowsActionType.NEW_TRIGGER_OR_ACTION_SELECTED,
  props<{ displayName: string; name: string; properties: PiecePropertyMap }>()
);
const moveAction = createAction(
  FlowsActionType.MOVE_ACTION,
  props<{ operation: MoveActionRequest }>()
);
const selectFirstInvalidStep = createAction(
  FlowsActionType.SELECT_FIRST_INVALID_STEP
);

const addAction = createAction(
  FlowsActionType.ADD_ACTION,
  props<{ operation: AddActionRequest }>()
);

const updateAction = createAction(
  FlowsActionType.UPDATE_ACTION,
  props<{ operation: UpdateActionRequest }>()
);

const deleteAction = createAction(
  FlowsActionType.DELETE_ACTION,
  props<{ operation: DeleteActionRequest }>()
);

const savedSuccess = createAction(
  FlowsActionType.SAVED_SUCCESS,
  props<{ saveRequestId: UUID; flow: PopulatedFlow }>()
);

const savedFailed = createAction(
  FlowsActionType.SAVED_FAILED,
  props<{ error: unknown }>()
);

const changeName = createAction(
  FlowsActionType.CHANGE_NAME,
  props<{ displayName: string }>()
);

const setInitial = createAction(
  FlowsActionType.SET_INITIAL,
  props<{
    flow: PopulatedFlow & { publishedFlowVersion?: FlowVersion };
    run: FlowRun | undefined;
    folder?: Folder;
  }>()
);
const importFlow = createAction(
  FlowsActionType.IMPORT_FLOW,
  props<{
    flow: PopulatedFlow;
  }>()
);
const duplicateStep = createAction(
  FlowsActionType.DUPLICATE_ACTION,
  props<{
    operation: {
      flowVersionWithArtifacts: FlowVersion;
      originalStepName: string;
    };
  }>()
);
const applyUpdateOperation = createAction(
  FlowsActionType.APPLY_UPDATE_OPERATION,
  props<{
    flow: PopulatedFlow;
    operation: FlowOperationRequest;
    saveRequestId: UUID;
  }>()
);
const toggleWaitingToSave = createAction(
  FlowsActionType.TOGGLE_WAITING_TO_SAVE
);
const deselectStep = createAction(FlowsActionType.DESELECT_STEP);

const enableFlow = createAction(FlowsActionType.ENABLE_INSTANCE);
const disableFlow = createAction(FlowsActionType.DISABLE_INSTANCE);
const publish = createAction(FlowsActionType.PUBLISH_FLOW);
const publishFailed = createAction(FlowsActionType.PUBLISH_FLOW_FAILED);

const publishSuccess = createAction(
  FlowsActionType.PUBLISH_FLOW_SUCCESS,
  props<{
    status: FlowStatus;
    showSnackbar: boolean;
    publishedFlowVersionId: ApId;
  }>()
);
const updateStatusSuccess = createAction(
  FlowsActionType.UPDATE_INSTANCE_STATUS_SUCCESS,
  props<{ status: FlowStatus }>()
);

export const FlowsActions = {
  setInitial,
  savedSuccess,
  addAction,
  savedFailed,
  deleteAction,
  updateTrigger,
  updateAction,
  changeName,
  applyUpdateOperation,
  deselectStep,
  selectFirstInvalidStep,
  moveAction,
  importFlow,
  toggleWaitingToSave,
  duplicateStep,
  publish,
  publishFailed,
  publishSuccess,
  enableFlow,
  disableFlow,
  updateStatusSuccess,
  newTriggerOrActionSelected,
};

export const SingleFlowModifyingState = [
  changeName,
  updateAction,
  addAction,
  updateTrigger,
  deleteAction,
  moveAction,
  duplicateStep,
];
