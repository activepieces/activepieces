import KSUID = require("ksuid");
import {BaseModel} from "./base-model";
import {CollectionId} from "./collection";

export type FlowId = KSUID;

export interface Flow extends BaseModel<FlowId> {

    displayName: string;
    collectionId: CollectionId;

}
