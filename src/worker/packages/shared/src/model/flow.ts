import KSUID = require("ksuid");
import {BaseModel} from "./base-model";
import {UserId} from "./user";

export type FlowId = KSUID;

export interface Flow extends BaseModel<FlowId> {


}
