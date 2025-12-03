
import { WorkerMachine } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    BaseColumnSchemaPart,
} from '../../database/database-common'


export const WorkerMachineEntity = new EntitySchema<WorkerMachine>({
    name: 'worker_machine',
    columns: {
        ...BaseColumnSchemaPart,
        information: {
            type: 'jsonb',
        },
    },
    relations: {},
})
