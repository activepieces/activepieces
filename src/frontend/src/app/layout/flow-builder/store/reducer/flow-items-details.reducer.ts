import { createReducer, on } from '@ngrx/store';
import { FlowItemDetailsActions } from '../action/flow-items-details.action';
import { FlowItemsDetailsState } from '../model/flow-items-details-state.model';
const initialState: FlowItemsDetailsState = {
	connectorsFlowItemsDetails: [],
	coreFlowItemsDetails: [],
	triggerFlowItemsDetails: [],
	userCollectionsFlowItemsDetails: [],
	connectorComponentsFlowItemDetails: [],
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
	),
	on(
		FlowItemDetailsActions.oldRemoteFlowItemDetailsLoadedSuccessfully,
		(state, { oldRemoteFlowItemDetails }): FlowItemsDetailsState => {
			const clonedState: FlowItemsDetailsState = JSON.parse(JSON.stringify(state));
			clonedState.userCollectionsFlowItemsDetails.push(oldRemoteFlowItemDetails);
			return clonedState;
		}
	)
);
