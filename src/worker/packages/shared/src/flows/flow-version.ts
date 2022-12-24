import {BaseModel} from "../common/base-model";
import {FlowId} from "./flow";
import {Trigger} from "./triggers/trigger";
import {ApId} from "../common/id-generator";

export type FlowVersionId = ApId;

export interface FlowVersion extends BaseModel<FlowVersionId> {

  flowId: FlowId;
  displayName: string;
  trigger: Trigger;
  valid: boolean;
  state: FlowVersionState;

}

export enum FlowVersionState {
  LOCKED = "LOCKED",
  DRAFT = "DRAFT"
}
