import { ConcurrencyPool } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../../database/database-common'

export const ConcurrencyPoolEntity = new EntitySchema<ConcurrencyPool>({
    name: 'concurrency_pool',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: ApIdSchema,
        maxConcurrentJobs: { type: Number },
    },
    indices: [
        { name: 'idx_concurrency_pool_platform_id', columns: ['platformId'] },
    ],
})
