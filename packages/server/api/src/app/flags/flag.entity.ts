import { Flag } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    BaseColumnSchemaPart,
} from '../database/database-common'

type FlagSchema = Flag

export const FlagEntity = new EntitySchema<FlagSchema>({
    name: 'flag',
    columns: {
        ...BaseColumnSchemaPart,
        value: {
            type: 'jsonb',
        },
    },
    indices: [],
    relations: {},
})
