
import { WorkerMachine } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    BaseColumnSchemaPart,
    JSONB_COLUMN_TYPE,
} from '../../database/database-common'


export const WorkerMachineEntity = new EntitySchema<WorkerMachine>({
    name: 'worker_machine',
    columns: {
        ...BaseColumnSchemaPart,
        information: {
            type: JSONB_COLUMN_TYPE,
        },
    },
    relations: {},
})
