import type { ApId, BaseModel, ProjectId } from '@activepieces/core-utils'

export type StoreEntryId = ApId

export const STORE_KEY_MAX_LENGTH = 128
export const STORE_VALUE_MAX_SIZE = 512 * 1024

export type StoreEntry = {
    key: string
    projectId: ProjectId
    value: unknown
} & BaseModel<StoreEntryId>