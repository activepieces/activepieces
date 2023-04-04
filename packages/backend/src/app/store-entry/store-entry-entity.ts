import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../helper/base-entity'
import { StoreEntry } from '@activepieces/shared'

type StoreEntrySchema = StoreEntry

export const StoreEntryEntity = new EntitySchema<StoreEntrySchema>({
    name: 'store-entry',
    columns: {
        ...BaseColumnSchemaPart,
        key: {
            type: String,
        },
        collectionId: ApIdSchema,
        value: {
            type: 'jsonb',
        },
    },
})
