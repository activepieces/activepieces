import { createAction, props } from '@ngrx/store';
import { FlowItemsDetailsState } from '../model/flow-items-details-state.model';

export enum FlowItemDetailsActionType {
	LOAD = '[FLOW_ITEMS_DETAILS] LOAD',
	LOADED_SUCCESSFULLY = '[FLOW_ITEMS_DETAILS] LOADED_SUCCESSFULLY',
}

const loadFlowItemsDetails = createAction(FlowItemDetailsActionType.LOAD);

const flowItemsDetailsLoadedSuccessfully = createAction(
	FlowItemDetailsActionType.LOADED_SUCCESSFULLY,
	props<{ flowItemsDetailsLoaded: FlowItemsDetailsState }>()
);

export const FlowItemDetailsActions = {
	loadFlowItemsDetails,
	flowItemsDetailsLoadedSuccessfully,
};
