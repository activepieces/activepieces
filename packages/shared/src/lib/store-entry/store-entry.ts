import { BaseModel } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { ProjectId } from '../project/project'

export type StoreEntryId = ApId


export type StoreEntry = {
    key: string
    projectId: ProjectId
    value: unknown
} & BaseModel<StoreEntryId>