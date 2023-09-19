import { Static, Type } from "@sinclair/typebox";
import {BaseModel} from "../common/base-model";
import {ApId} from "../common/id-generator";
import { ProjectId } from "../project/project";
import { FileType } from "./file-type";
import { FileCompression } from "./file-compression";

export type FileId = ApId;


export interface File extends BaseModel<FileId> {
    data: Buffer;
    projectId: ProjectId;
    type: FileType;
    compression: FileCompression;
}

export const FileData = Type.Object({
    data: Type.Any(),
    mimetype: Type.String(),
    filename: Type.String(),
})

export type FileData = Static<typeof FileData>;
