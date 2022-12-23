import KSUID = require("ksuid");
import {BaseModel} from "../model/base-model";
import {CollectionId} from "./collection";
import {Config} from "./config";

export type CollectionVersionId = KSUID;

export interface CollectionVersion extends BaseModel<CollectionVersionId> {

    displayName: string;
    collectionId: CollectionId;
    configs: Config[];
    state: CollectionVersionState;
}

export enum CollectionVersionState {
  LOCKED = "LOCKED",
  DRAFT = "DRAFT"
}
