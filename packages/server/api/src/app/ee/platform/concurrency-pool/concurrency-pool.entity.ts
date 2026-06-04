import { ConcurrencyPool, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../../database/database-common'

export type ConcurrencyPoolEntitySchema = ConcurrencyPool & {
    projects: Project[]
}

export const ConcurrencyPoolEntity = new EntitySchema<ConcurrencyPoolEntitySchema>({
    name: 'concurrency_pool',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: ApIdSchema,
        key: { type: String },
        maxConcurrentJobs: { type: Number },
    },
    indices: [
        { name: 'idx_concurrency_pool_platform_key', columns: ['platformId', 'key'], unique: true },
    ],
    relations: {
        projects: {
            type: 'one-to-many',
            target: 'project',
            inverseSide: 'pool',
        },
    },
})
