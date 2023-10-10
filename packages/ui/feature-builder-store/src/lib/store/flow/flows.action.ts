import { createAction, props } from '@ngrx/store';
import { UUID } from 'angular2-uuid';
import {
  AddActionRequest,
  Flow,
  DeleteActionRequest,
  UpdateActionRequest,
  UpdateTriggerRequest,
  FlowRun,
  FlowOperationRequest,
  Folder,
  MoveActionRequest,
  FlowVersion,
} from '@activepieces/shared';

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
}

const updateTrigger = createAction(
  FlowsActionType.UPDATE_TRIGGER,
  props<{ operation: UpdateTriggerRequest }>()
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
  props<{ saveRequestId: UUID; flow: Flow }>()
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
    flow: Flow;
    run: FlowRun | undefined;
    folder?: Folder;
  }>()
);
const importFlow = createAction(
  FlowsActionType.SET_INITIAL,
  props<{
    flow: Flow;
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
  props<{ flow: Flow; operation: FlowOperationRequest; saveRequestId: UUID }>()
);
const toggleWaitingToSave = createAction(
  FlowsActionType.TOGGLE_WAITING_TO_SAVE
);
const deselectStep = createAction(FlowsActionType.DESELECT_STEP);

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
