import { AIProvider } from '@activepieces/common-ai'
import { Platform } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart, JSON_COLUMN_TYPE } from '../database/database-common'
import { EncryptedObject } from '../helper/encryption'

const AIProviderEncrypted = Type.Composite([Type.Omit(AIProvider, ['config']), Type.Object({
    config: EncryptedObject,
})])

type AIProviderEncrypted = Static<typeof AIProviderEncrypted>

export type AIProviderSchema = AIProviderEncrypted & {
    platform: Platform
}

export const AIProviderEntity = new EntitySchema<AIProviderSchema>({
    name: 'ai_provider',
    columns: {
        ...BaseColumnSchemaPart,
        config: {
            type: JSON_COLUMN_TYPE,
            nullable: false,
        },
        provider: {
            type: String,
            nullable: false,
        },
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_ai_provider_platform_id_provider',
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
                foreignKeyConstraintName: 'fk_ai_provider_platform_id',
            },
        },
    },
})
