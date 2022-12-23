import {BaseModel} from "./base-model";
import {FlowId} from "./flow";
import {Trigger} from "./trigger";
import {ApId} from "../helper/id-generator";

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
