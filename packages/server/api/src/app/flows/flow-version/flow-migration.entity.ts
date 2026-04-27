import { FlowMigration, Platform } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

type FlowMigrationSchema = FlowMigration & {
    platform: Platform
}

export const FlowMigrationEntity = new EntitySchema<FlowMigrationSchema>({
    name: 'flow_migration',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        userId: {
            ...ApIdSchema,
            nullable: false,
        },
        type: {
            type: String,
            nullable: false,
        },
        status: {
            type: String,
            nullable: false,
        },
        migratedVersions: {
            type: 'jsonb',
            nullable: false,
        },
        failedFlowVersions: {
            type: 'jsonb',
            nullable: false,
        },
        params: {
            type: 'jsonb',
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_flow_migration_platform_id',
            columns: ['platformId'],
        },
    ],
    relations: {
        platform: {
            type: 'many-to-one',
            target: 'platform',
            joinColumn: {
                name: 'platformId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_flow_migration_platform',
            },
            onDelete: 'CASCADE',
        },
    },
})
