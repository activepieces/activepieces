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
  props<{ operation: UpdateActionRequest; updatingMissingStep?: boolean }>()
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

const applyUpdateOperation = createAction(
  FlowsActionType.APPLY_UPDATE_OPERATION,
  props<{ flow: Flow; operation: FlowOperationRequest; saveRequestId: UUID }>()
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
};

export const SingleFlowModifyingState = [
  changeName,
  updateAction,
  addAction,
  updateTrigger,
  deleteAction,
  moveAction,
];
