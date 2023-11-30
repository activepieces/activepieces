import { BaseModel } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { ProjectId } from '../project/project'
import { FileType } from './file-type'
import { FileCompression } from './file-compression'

export type FileId = ApId


export type File = {
    data: Buffer
    projectId: ProjectId
    type: FileType
    compression: FileCompression
} & BaseModel<FileId>
