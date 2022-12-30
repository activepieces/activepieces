import { createReducer, on } from '@ngrx/store';
import { FlowItemDetailsActions } from '../action/flow-items-details.action';
import { FlowItemsDetailsState } from '../model/flow-items-details-state.model';
const initialState: FlowItemsDetailsState = {
	coreFlowItemsDetails: [],
	coreTriggerFlowItemsDetails: [],
	connectorComponentsActionsFlowItemDetails: [],
	connectorComponentsTriggersFlowItemDetails: [],
	loaded: false,
};
export const flowItemsDetailsReducer = createReducer(
	initialState,
	on(FlowItemDetailsActions.clearFlowItemsDetails, (): FlowItemsDetailsState => {
		return initialState;
	}),
	on(
		FlowItemDetailsActions.flowItemsDetailsLoadedSuccessfully,
		(state, { flowItemsDetailsLoaded }): FlowItemsDetailsState => {
			return flowItemsDetailsLoaded;
		}
	)
);
