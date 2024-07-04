
import { Platform, WorkerMachine } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
    JSONB_COLUMN_TYPE,
} from '../../database/database-common'

type WorkerMachineSchema = WorkerMachine & {
    platform: Platform
}

export const WorkerMachineEntity = new EntitySchema<WorkerMachineSchema>({
    name: 'worker_machine',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            ...ApIdSchema,
            nullable: true,
        },
        type: {
            type: String,
        },
        information: {
            type: JSONB_COLUMN_TYPE,
        },
    },
    relations: {
        platform: {
            type: 'many-to-one',
            target: 'platform',
            joinColumn: {
                name: 'platformId',
            },
        },
    },
})
