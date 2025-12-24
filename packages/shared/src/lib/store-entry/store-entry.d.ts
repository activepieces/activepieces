import { BaseModel } from '../common/base-model';
import { ApId } from '../common/id-generator';
import { ProjectId } from '../project/project';
export type StoreEntryId = ApId;
export declare const STORE_KEY_MAX_LENGTH = 128;
export declare const STORE_VALUE_MAX_SIZE: number;
export type StoreEntry = {
    key: string;
    projectId: ProjectId;
    value: unknown;
} & BaseModel<StoreEntryId>;
