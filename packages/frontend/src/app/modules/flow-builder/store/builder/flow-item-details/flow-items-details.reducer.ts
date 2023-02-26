import { createReducer, on } from '@ngrx/store';
import { FlowItemDetailsActions } from './flow-items-details.action';
import { FlowItemsDetailsState } from '../../model/flow-items-details-state.model';
const initialState: FlowItemsDetailsState = {
	coreFlowItemsDetails: [],
	coreTriggerFlowItemsDetails: [],
	customPiecesActionsFlowItemDetails: [],
	customPiecesTriggersFlowItemDetails: [],
	loaded: false,
};
export const flowItemsDetailsReducer = createReducer(
	initialState,
	on(FlowItemDetailsActions.loadFlowItemsDetails, (): FlowItemsDetailsState => {
		return initialState;
	}),
	on(
		FlowItemDetailsActions.flowItemsDetailsLoadedSuccessfully,
		(state, { flowItemsDetailsLoaded }): FlowItemsDetailsState => {
			return flowItemsDetailsLoaded;
		}
	)
);
