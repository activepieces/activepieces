import {BaseModel} from "./base-model";
import {CollectionId} from "../collection/collection";
import {ApId} from "../helper/id-generator";

export type FlowId = ApId;

export interface Flow extends BaseModel<FlowId> {

    displayName: string;
    collectionId: CollectionId;

}
