import { Action, Trigger } from '@activepieces/shared';

export type FlowItemRenderInfo = {
  boundingBox?: BoundingBox;
  connectionsBox?: BoundingBox;
  xOffset?: number;
  yOffset?: number;
  yOffsetFromLastNode?: number;
  width?: number;
  height?: number;
  nextAction?: FlowItem;
};

export type FlowItem = (Action | Trigger) & FlowItemRenderInfo;

export interface BoundingBox {
  width: number;
  height: number;
}
