import { FlowAiProviderMigration, FlowAiProviderMigrationStatus } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

export const FlowAiProviderMigrationEntity = new EntitySchema<FlowAiProviderMigration>({
    name: 'flow_ai_provider_migration',
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
        status: {
            type: String,
            default: FlowAiProviderMigrationStatus.RUNNING,
            nullable: false,
        },
        migratedVersions: {
            type: 'jsonb',
            default: [],
            nullable: false,
        },
        failedFlowVersions: {
            type: 'jsonb',
            default: [],
            nullable: false,
        },
        sourceModel: {
            type: 'jsonb',
            nullable: false,
        },
        targetModel: {
            type: 'jsonb',
            nullable: false,
        },
        projectIds: {
            type: 'jsonb',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_flow_ai_provider_migration_platform_id',
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
                foreignKeyConstraintName: 'fk_flow_ai_provider_migration_platform',
            },
            onDelete: 'CASCADE',
        },
    },
})
