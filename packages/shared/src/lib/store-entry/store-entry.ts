import {BaseModel} from "../common/base-model";
import {ApId} from "../common/id-generator";
import {CollectionId} from "../collections/collection";

export type StoreEntryId = ApId;


export interface StoreEntry extends BaseModel<StoreEntryId> {
    key: string;
    collectionId: CollectionId,
    value: unknown;
}