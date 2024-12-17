
import { WorkerMachine } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    BaseColumnSchemaPart,
    JSONB_COLUMN_TYPE,
} from '../../database/database-common'

type WorkerMachineSchema = WorkerMachine

export const WorkerMachineEntity = new EntitySchema<WorkerMachineSchema>({
    name: 'worker_machine',
    columns: {
        ...BaseColumnSchemaPart,
        information: {
            type: JSONB_COLUMN_TYPE,
        },
    },
    relations: {
    },
})
