import {BaseModel} from "../common/base-model";
import {ApId} from "../common/id-generator";

export type FileId = ApId;


export interface File extends BaseModel<FileId> {
    data: ArrayBuffer;
}