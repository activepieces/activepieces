import { Alert } from '@activepieces/ee-shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../database/database-common'

type AlertSchema = Alert

export const AlertEntity = new EntitySchema<AlertSchema>({
    name: 'alert',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: {
            ...ApIdSchema,
        },
        channel: {
            type: String,
        },
        receiver: {
            type: String,
            nullable: false,
        },
    },
})
