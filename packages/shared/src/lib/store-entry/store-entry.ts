import {BaseModel} from "../common/base-model";
import {ApId} from "../common/id-generator";
import { ProjectId } from "../project/project";

export type StoreEntryId = ApId;


export interface StoreEntry extends BaseModel<StoreEntryId> {
    key: string;
    projectId: ProjectId
    value: unknown;
}