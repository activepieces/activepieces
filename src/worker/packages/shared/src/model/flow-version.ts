import KSUID = require("ksuid");
import {BaseModel} from "./base-model";
import {UserId} from "./user";
import {FlowId} from "./flow";
import {Trigger} from "./trigger";

export type FlowVersionId = KSUID;

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
