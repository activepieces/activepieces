import { FlowItemDetails } from '@activepieces/ui/common';

export interface FlowItemsDetailsState {
  coreFlowItemsDetails: FlowItemDetails[];
  coreTriggerFlowItemsDetails: FlowItemDetails[];
  customPiecesActionsFlowItemDetails: FlowItemDetails[];
  customPiecesTriggersFlowItemDetails: FlowItemDetails[];
  loaded: boolean;
}
