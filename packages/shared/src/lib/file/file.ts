import { Static, Type } from "@sinclair/typebox";
import {BaseModel} from "../common/base-model";
import {ApId} from "../common/id-generator";
import { ProjectId } from "../project/project";

export type FileId = ApId;


export interface File extends BaseModel<FileId> {
    data: Buffer;
    projectId: ProjectId;
}

export const FileData = Type.Object({
    data: Type.Any(),
    mimetype: Type.String(),
    filename: Type.String(),
})

export type FileData = Static<typeof FileData>;