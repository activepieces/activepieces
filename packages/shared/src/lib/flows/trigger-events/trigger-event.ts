import { BaseModel } from '../../common/base-model'
import { ProjectId } from '../../project/project'
export type TriggerEventId = string

export type TriggerEvent = {
    projectId: ProjectId
    flowId: string
    sourceName: string
    payload: unknown
} & BaseModel<TriggerEventId>
