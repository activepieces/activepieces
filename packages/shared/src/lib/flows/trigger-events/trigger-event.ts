import { BaseModel } from '../../common/base-model'
import { FileId } from '../../file'
import { ProjectId } from '../../project/project'

export type TriggerEventId = string

export type TriggerEvent = {
    projectId: ProjectId
    flowId: string
    sourceName: string
    fileId: FileId
} & BaseModel<TriggerEventId>
