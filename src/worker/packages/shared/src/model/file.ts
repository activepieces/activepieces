import {BaseModel} from "./base-model";
import KSUID = require("ksuid");

export type FileId = KSUID;

export interface File extends BaseModel<FileId> {
    id: FileId,
    contentType: string;
    size: number;
    data: ArrayBuffer;
}