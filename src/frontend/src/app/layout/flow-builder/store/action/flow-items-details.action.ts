import { createAction, props } from '@ngrx/store';
import { UUID } from 'angular2-uuid';
import { FlowItemDetails } from '../../page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';
import { FlowItemsDetailsState } from '../model/flow-items-details-state.model';

export enum FlowItemDetailsActionType {
	CLEAR = '[FLOW_ITEMS_DETAILS] CLEAR',
	LOAD = '[FLOW_ITEMS_DETAILS] LOAD',
	LOADED_SUCCESSFULLY = '[FLOW_ITEMS_DETAILS] LOADED_SUCCESSFULLY',
	LOAD_OLD_REMOTE_FLOW_ITEM_DETAILS = '[FLOW_ITEMS_DETAILS]  LOAD_OLD_REMOTE_FLOW_ITEM_DETAILS',
	OLD_REMOTE_FLOW_ITEM_DETAILS_LOADED_SUCESSFULLY = '[FLOW_ITEMS_DETAILS]  LOAD_OLD_REMOTE_FLOW_ITEM_DETAILS_LOADED_SUCCESSFULLY',
}

const clearFlowItemsDetails = createAction(FlowItemDetailsActionType.CLEAR);
const loadOldRemoteFlowItemDetails = createAction(
	FlowItemDetailsActionType.LOAD_OLD_REMOTE_FLOW_ITEM_DETAILS,
	props<{ collectionVersionId: UUID }>()
);
const oldRemoteFlowItemDetailsLoadedSuccessfully = createAction(
	FlowItemDetailsActionType.OLD_REMOTE_FLOW_ITEM_DETAILS_LOADED_SUCESSFULLY,
	props<{ oldRemoteFlowItemDetails: FlowItemDetails }>()
);
const loadFlowItemsDetails = createAction(FlowItemDetailsActionType.LOAD);

const flowItemsDetailsLoadedSuccessfully = createAction(
	FlowItemDetailsActionType.LOADED_SUCCESSFULLY,
	props<{ flowItemsDetailsLoaded: FlowItemsDetailsState }>()
);

export const FlowItemDetailsActions = {
	clearFlowItemsDetails,
	loadFlowItemsDetails,
	flowItemsDetailsLoadedSuccessfully,
	loadOldRemoteFlowItemDetails,
	oldRemoteFlowItemDetailsLoadedSuccessfully,
};
