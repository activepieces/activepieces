import { ConfiguredAIProvider, Platform } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart } from '../database/database-common'

export type ConfiguredAIProviderSchema = ConfiguredAIProvider & {
    platform: Platform
}

export const ConfiguredAIProviderEntity = new EntitySchema<ConfiguredAIProviderSchema>({
    name: 'configured_ai_provider',
    columns: {
        ...BaseColumnSchemaPart,
        apiKey: {
            type: String,
            nullable: true,
        },
        provider: {
            type: String,
            nullable: false,
        },
        platformId: {
            type: String,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_configured_ai_provider_platform_id_provider',
            columns: ['platformId', 'provider'],
            unique: true,
        },
    ],
    relations: {
        platform: {
            type: 'many-to-one',
            target: 'platform',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'platformId',
                foreignKeyConstraintName: 'fk_configured_ai_provider_platform_id',
            },
        },
    },
})
