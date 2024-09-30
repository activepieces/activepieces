import { BaseModel } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { ProjectId } from '../project/project'

export type StoreEntryId = ApId

export const STORE_KEY_MAX_LENGTH = 128
export const STORE_VALUE_MAX_SIZE = 512 * 1024

export type StoreEntry = {
    key: string
    projectId: ProjectId
    value: unknown
} & BaseModel<StoreEntryId>