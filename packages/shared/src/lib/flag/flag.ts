import {BaseModel} from "../common/base-model";
import {ApId} from "../common/id-generator";

export type FlagId = ApId;

export interface Flag extends BaseModel<FlagId> {

    value: unknown;
}
