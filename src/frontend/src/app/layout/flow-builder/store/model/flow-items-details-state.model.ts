import { FlowItemDetails } from '../../page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';

export interface FlowItemsDetailsState {
	coreFlowItemsDetails: FlowItemDetails[];
	triggerFlowItemsDetails: FlowItemDetails[];
	connectorsFlowItemsDetails: FlowItemDetails[];
	userCollectionsFlowItemsDetails: FlowItemDetails[];
	connectorComponentsFlowItemDetails: FlowItemDetails[];
	loaded: boolean;
}
