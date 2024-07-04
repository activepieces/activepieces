
import { Platform, WorkerMachine } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
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
        cpuUsage: {
            type: 'float',
        },
        ramUsage: {
            type: 'float',
        },
        totalRamInBytes: {
            type: 'bigint',
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
