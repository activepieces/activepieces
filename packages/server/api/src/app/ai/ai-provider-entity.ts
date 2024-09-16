import { AiProviderConfig, Platform } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart, JSON_COLUMN_TYPE } from '../database/database-common'
import { EncryptedObject } from '../helper/encryption'

const AiProviderConfigEncrypted = Type.Composite([Type.Omit(AiProviderConfig, ['config']), Type.Object({
    config: EncryptedObject,
})])

type AiProviderConfigEncrypted = Static<typeof AiProviderConfigEncrypted>

export type AiProviderSchema = AiProviderConfigEncrypted & {
    platform: Platform
}

export const AiProviderEntity = new EntitySchema<AiProviderSchema>({
    name: 'ai_provider',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            type: String,
            nullable: false,
        },
        config: {
            type: JSON_COLUMN_TYPE,
            nullable: false,
        },
        baseUrl: {
            type: String,
            nullable: false,
        },
        provider: {
            type: String,
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