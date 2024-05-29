import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../database/database-common'
import { Alert, AlertChannel } from '@activepieces/ee-shared'

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
            enum: AlertChannel,
        },
        details: {
            type: String,
            nullable: false,
        },
    },
})
