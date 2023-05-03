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
  StepLocationRelativeToParent,
  Folder,
} from '@activepieces/shared';
import { RightSideBarType } from '../../model/enums/right-side-bar-type.enum';
import { LeftSideBarType } from '../../model/enums/left-side-bar-type.enum';
import { NO_PROPS } from '../../model';

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
  SET_LEFT_SIDEBAR = '[FLOWS] SET_LEFT_SIDEBAR',
  SET_RIGHT_SIDEBAR = '[FLOWS] SET_RIGHT_BAR',
  DESELECT_STEP = '[FLOWS] DESELECT_STEP',
  SET_RUN = '[FLOWS] SET_RUN',
  EXIT_RUN = '[FLOWS] EXIT_RUN',
  SELECT_STEP_BY_NAME = '[FLOWS] SELECT_STEP_BY_NAME',
  SELECT_FIRST_INVALID_STEP = '[FLOWS] SELECT_FIRST_INVALID_STEP',
}

const updateTrigger = createAction(
  FlowsActionType.UPDATE_TRIGGER,
  props<{ operation: UpdateTriggerRequest }>()
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
  props<{ error: any }>()
);

const changeName = createAction(
  FlowsActionType.CHANGE_NAME,
  props<{ displayName: string }>()
);

const setInitial = createAction(
  FlowsActionType.SET_INITIAL,
  props<{ flow: Flow; run: FlowRun | undefined; folder?: Folder }>()
);

const applyUpdateOperation = createAction(
  FlowsActionType.APPLY_UPDATE_OPERATION,
  props<{ flow: Flow; operation: FlowOperationRequest; saveRequestId: UUID }>()
);

const exitRun = createAction(FlowsActionType.EXIT_RUN);

const setRun = createAction(FlowsActionType.SET_RUN, props<{ run: FlowRun }>());

const deselectStep = createAction(FlowsActionType.DESELECT_STEP);

const selectStepByName = createAction(
  FlowsActionType.SELECT_STEP_BY_NAME,
  props<{ stepName: string }>()
);

const setLeftSidebar = createAction(
  FlowsActionType.SET_LEFT_SIDEBAR,
  props<{ sidebarType: LeftSideBarType }>()
);

const setRightSidebar = createAction(
  FlowsActionType.SET_RIGHT_SIDEBAR,
  props<{
    sidebarType: RightSideBarType;
    props:
      | {
          stepLocationRelativeToParent: StepLocationRelativeToParent;
          stepName: string;
        }
      | typeof NO_PROPS;
  }>()
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
  setLeftSidebar,
  setRightSidebar,
  setRun,
  deselectStep,
  exitRun,
  selectStepByName,
  selectFirstInvalidStep,
};

export const SingleFlowModifyingState = [
  changeName,
  updateAction,
  addAction,
  updateTrigger,
  deleteAction,
];
