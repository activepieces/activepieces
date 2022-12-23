import {BaseModel} from "./base-model";
import {ApId} from "../helper/id-generator";

export type FileId = ApId;

export interface File extends BaseModel<FileId> {
    id: FileId,
    contentType: string;
    size: number;
    data: ArrayBuffer;
}