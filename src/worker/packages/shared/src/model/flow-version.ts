import KSUID = require("ksuid");
import {BaseModel} from "./base-model";
import {UserId} from "./user";
import {FlowId} from "./flow";
import {Trigger} from "./trigger";

export type FlowVersionId = KSUID;

export class FlowVersion extends BaseModel<FlowVersionId> {

  flowId: FlowId;
  displayName: string;
  trigger: Trigger<any, any>;
  valid: boolean;
  state: FlowVersionState;

}

export enum FlowVersionState {
  LOCKED = "LOCKED",
  DRAFT = "DRAFT"
}
