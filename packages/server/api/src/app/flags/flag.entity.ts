import { Flag } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    BaseColumnSchemaPart,
    JSONB_COLUMN_TYPE,
} from '../database/database-common'

type FlagSchema = Flag

export const FlagEntity = new EntitySchema<FlagSchema>({
    name: 'flag',
    columns: {
        ...BaseColumnSchemaPart,
        value: {
            type: JSONB_COLUMN_TYPE,
        },
    },
    indices: [],
    relations: {},
})
