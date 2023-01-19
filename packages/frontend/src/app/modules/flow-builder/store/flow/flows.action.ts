import { createAction, props } from '@ngrx/store';
import { UUID } from 'angular2-uuid';
import { LeftSideBarType } from '../../../common/model/enum/left-side-bar-type.enum';
import { RightSideBarType } from '../../../common/model/enum/right-side-bar-type.enum';
import {
	AddActionRequest,
	Flow,
	DeleteActionRequest,
	UpdateActionRequest,
	UpdateTriggerRequest,
	FlowRun,
	FlowId,
	FlowOperationRequest,
} from '@activepieces/shared';

export enum FlowsActionType {
	// Flow Version Modifying Action
	UPDATE_TRIGGER = '[FLOWS] UPDATE_TRIGGER',
	CHANGE_NAME = '[FLOWS] CHANGE_NAME',
	ADD_ACTION = '[FLOWS] ADD_ACTION',
	DELETE_ACTION = '[FLOWS] DELETE_ACTION',
	UPDATE_ACTION = '[FLOWS] UPDATE_ACTION',

	SET_INITIAL = '[FLOWS] SET_INITIAL',
	DELETE_FLOW = '[FLOWS] DELETE_FLOW',
	ADD_FLOW = '[FLOWS] ADD_FLOW',
	SAVED_FAILED = '[FLOWS] SAVED_FAILED',
	SAVED_SUCCESS = '[FLOWS] SAVED_SUCCESS',
	SELECT_FLOW = '[FLOWS] SELECT_FLOW',
	APPLY_UPDATE_OPERATION = '[FLOWS] APPLY_UPDATE_OPERATION',
	DELETE_FLOW_STARTED = '[FLOWS] DELETE_FLOW_STARTED',
	SET_LEFT_SIDEBAR = '[FLOWS] SET_LEFT_SIDEBAR',
	SET_RIGHT_SIDEBAR = '[FLOWS] SET_RIGHT_BAR',
	DESELECT_STEP = '[FLOWS] DESELECT_STEP',
	SET_RUN = '[FLOWS] SET_RUN',
	EXIT_RUN = '[FLOWS] EXIT_RUN',
	SELECT_STEP_BY_NAME = '[FLOWS] SELECT_STEP_BY_NAME',
	DELETE_SUCCESS = '[FLOWS] DELETE_SUCCESS',
}

export const updateTrigger = createAction(FlowsActionType.UPDATE_TRIGGER, props<{ operation: UpdateTriggerRequest }>());

export const addAction = createAction(FlowsActionType.ADD_ACTION, props<{ operation: AddActionRequest }>());

export const updateAction = createAction(FlowsActionType.UPDATE_ACTION, props<{ operation: UpdateActionRequest }>());

export const deleteAction = createAction(FlowsActionType.DELETE_ACTION, props<{ operation: DeleteActionRequest }>());

export const savedSuccess = createAction(FlowsActionType.SAVED_SUCCESS, props<{ saveRequestId: UUID; flow: Flow }>());

export const savedFailed = createAction(FlowsActionType.SAVED_FAILED, props<{ error: any }>());

export const deleteFlow = createAction(FlowsActionType.DELETE_FLOW, props<{ flowId: FlowId }>());

export const addFlow = createAction(FlowsActionType.ADD_FLOW, props<{ flow: Flow }>());

export const changeName = createAction(FlowsActionType.CHANGE_NAME, props<{ flowId: FlowId; displayName: string }>());

export const setInitial = createAction(
	FlowsActionType.SET_INITIAL,
	props<{ flows: Flow[]; run: FlowRun | undefined }>()
);

export const applyUpdateOperation = createAction(
	FlowsActionType.APPLY_UPDATE_OPERATION,
	props<{ flow: Flow; operation: FlowOperationRequest; saveRequestId: UUID }>()
);

export const deleteFlowStarted = createAction(
	FlowsActionType.DELETE_FLOW_STARTED,
	props<{ flowId: FlowId; saveRequestId: UUID }>()
);

export const selectFlow = createAction(FlowsActionType.SELECT_FLOW, props<{ flowId: FlowId }>());

export const exitRun = createAction(FlowsActionType.EXIT_RUN, props<{ flowId: FlowId }>());

export const setRun = createAction(FlowsActionType.SET_RUN, props<{ flowId: FlowId; run: FlowRun }>());

export const deselectStep = createAction(FlowsActionType.DESELECT_STEP);

export const selectStepByName = createAction(FlowsActionType.SELECT_STEP_BY_NAME, props<{ stepName: string }>());

export const deleteSuccess = createAction(FlowsActionType.DELETE_SUCCESS, props<{ saveRequestId: UUID }>());

export const setLeftSidebar = createAction(FlowsActionType.SET_LEFT_SIDEBAR, props<{ sidebarType: LeftSideBarType }>());

export const setRightSidebar = createAction(
	FlowsActionType.SET_RIGHT_SIDEBAR,
	props<{ sidebarType: RightSideBarType; props: any }>()
);

export const FlowsActions = {
	setInitial,
	savedSuccess,
	addAction,
	savedFailed,
	deleteFlow,
	addFlow,
	deleteAction,
	updateTrigger,
	selectFlow,
	updateAction,
	changeName,
	applyUpdateOperation,
	deleteFlowStarted,
	setLeftSidebar,
	setRightSidebar,
	setRun,
	deselectStep,
	exitRun,
	selectStepByName,
	deleteSuccess,
};

export const SingleFlowModifyingState = [changeName, updateAction, addAction, updateTrigger, deleteAction];
