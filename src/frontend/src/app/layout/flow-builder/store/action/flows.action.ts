import { createAction, props } from '@ngrx/store';
import { UUID } from 'angular2-uuid';
import { Trigger } from '../../../common-layout/model/flow-builder/trigger/trigger.interface';
import { InstanceRun } from '../../../common-layout/model/instance-run.interface';
import { LeftSideBarType } from '../../../common-layout/model/enum/left-side-bar-type.enum';
import { RightSideBarType } from '../../../common-layout/model/enum/right-side-bar-type.enum';
import { Flow } from '../../../common-layout/model/flow.class';
import { FlowItem } from 'src/app/layout/common-layout/model/flow-builder/flow-item';

export enum FlowsActionType {
	SET_INITIAL = '[FLOWS] SET_INITIAL',
	DELETE_FLOW = '[FLOWS] DELETE_FLOW',
	ADD_FLOW = '[FLOWS] ADD_FLOW',
	CHANGE_NAME = '[FLOWS] CHANGE_NAME',
	SAVED_FAILED = '[FLOWS] SAVED_FAILED',
	SAVED_SUCCESS = '[FLOWS] SAVED_SUCCESS',
	SELECT_FLOW = '[FLOWS] SELECT_FLOW',
	DELETE_STEP = '[FLOWS] DELETE_STEP',
	UPDATE_STEP = '[FLOWS] UPDATE_STEP',
	SAVE_FLOW_STARTED = '[FLOWS] SAVE_FLOW_STARTED',
	DELETE_FLOW_STARTED = '[FLOWS] DELETE_FLOW_STARTED',
	ADD_STEP = '[FLOWS] ADD_STEP',
	REPLACE_TRIGGER = '[FLOWS] REPLACE_TRIGGER',
	DROP_PIECE = '[FLOWS] DROP_PIECE',

	SET_LEFT_SIDEBAR = '[FLOWS] SET_LEFT_SIDEBAR',
	SET_RIGHT_SIDEBAR = '[FLOWS] SET_RIGHT_BAR',
	SELECT_STEP = '[FLOWS] SELECT_STEP',
	DESELECT_STEP = '[FLOWS] DESELECT_STEP',
	SET_RUN = '[FLOWS] SET_RUN',
	EXIT_RUN = '[FLOWS] EXIT_RUN',
	SELECT_STEP_BY_NAME = '[FLOWS] SELECT_STEP_BY_NAME',
	DELETE_SUCCESS = '[FLOWS] DELETE_SUCCESS',
}

export const SingleFlowModifyingState = [
	FlowsActionType.DROP_PIECE,
	FlowsActionType.CHANGE_NAME,
	FlowsActionType.DELETE_STEP,
	FlowsActionType.ADD_STEP,
	FlowsActionType.REPLACE_TRIGGER,
	FlowsActionType.UPDATE_STEP,
];

export const savedSuccess = createAction(FlowsActionType.SAVED_SUCCESS, props<{ saveId: UUID; flow: Flow }>());

export const savedFailed = createAction(FlowsActionType.SAVED_FAILED, props<{ error: any }>());

export const replaceTrigger = createAction(FlowsActionType.REPLACE_TRIGGER, props<{ newTrigger: Trigger }>());

export const dropPiece = createAction(
	FlowsActionType.DROP_PIECE,
	props<{ draggedPieceName: string; newParentName: string }>()
);

export const addStep = createAction(
	FlowsActionType.ADD_STEP,
	props<{
		newAction: FlowItem;
	}>()
);

export const updateStep = createAction(
	FlowsActionType.UPDATE_STEP,
	props<{ stepName: string; newStep: FlowItem | Trigger }>()
);

export const deleteStep = createAction(FlowsActionType.DELETE_STEP, props<{ stepName: string }>());

export const deleteFlow = createAction(FlowsActionType.DELETE_FLOW, props<{ flowId: UUID }>());

export const addFlow = createAction(FlowsActionType.ADD_FLOW, props<{ flow: Flow }>());

export const changeName = createAction(FlowsActionType.CHANGE_NAME, props<{ flowId: UUID; displayName: string }>());

export const setInitial = createAction(
	FlowsActionType.SET_INITIAL,
	props<{ flows: Flow[]; run: InstanceRun | undefined }>()
);

export const saveFlowStarted = createAction(FlowsActionType.SAVE_FLOW_STARTED, props<{ flow: Flow; saveId: UUID }>());

export const deleteFlowStarted = createAction(
	FlowsActionType.DELETE_FLOW_STARTED,
	props<{ flowId: UUID; saveId: UUID }>()
);

export const selectFlow = createAction(FlowsActionType.SELECT_FLOW, props<{ flowId: UUID }>());

export const exitRun = createAction(FlowsActionType.EXIT_RUN, props<{ flowId: UUID }>());

export const setRun = createAction(FlowsActionType.SET_RUN, props<{ flowId: UUID; run: InstanceRun }>());

export const selectStep = createAction(FlowsActionType.SELECT_STEP, props<{ step: FlowItem }>());

export const deselectStep = createAction(FlowsActionType.DESELECT_STEP);

export const selectStepByName = createAction(FlowsActionType.SELECT_STEP_BY_NAME, props<{ stepName: string }>());

export const deleteSuccess = createAction(FlowsActionType.DELETE_SUCCESS, props<{ saveId: UUID }>());

export const setLeftSidebar = createAction(FlowsActionType.SET_LEFT_SIDEBAR, props<{ sidebarType: LeftSideBarType }>());

export const setRightSidebar = createAction(
	FlowsActionType.SET_RIGHT_SIDEBAR,
	props<{ sidebarType: RightSideBarType; props: any }>()
);

export const FlowsActions = {
	setInitial,
	savedSuccess,
	addStep,
	dropPiece,
	savedFailed,
	deleteFlow,
	addFlow,
	deleteStep,
	replaceTrigger,
	selectFlow,
	updateStep,
	changeName,
	saveFlowStarted,
	deleteFlowStarted,
	setLeftSidebar,
	selectStep,
	setRightSidebar,
	setRun,
	deselectStep,
	exitRun,
	selectStepByName,
	deleteSuccess,
};
