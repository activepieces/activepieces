import { Action, Trigger } from '@activepieces/shared';

export type FlowItemRenderInfo = {
  boundingBox?: BoundingBox;
  connectionsBox?: BoundingBox;
  nextAction?: FlowItem;
  indexInDfsTraversal?: number;
};

export type FlowItem = (Action | Trigger) & FlowItemRenderInfo;
export type ActionFlowItem = Action & FlowItemRenderInfo;

export interface BoundingBox {
  width: number;
  height: number;
}
