import { FlowItemDetails } from '../../page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';

export interface FlowItemsDetailsState {
  coreFlowItemsDetails: FlowItemDetails[];
  coreTriggerFlowItemsDetails: FlowItemDetails[];
  customPiecesActionsFlowItemDetails: FlowItemDetails[];
  customPiecesTriggersFlowItemDetails: FlowItemDetails[];
  loaded: boolean;
}
