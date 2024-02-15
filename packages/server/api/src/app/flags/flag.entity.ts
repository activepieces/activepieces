import { EntitySchema } from 'typeorm'
import {
    BaseColumnSchemaPart,
    JSONB_COLUMN_TYPE,
} from '../database/database-common'
import { Flag } from '@activepieces/shared'

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
