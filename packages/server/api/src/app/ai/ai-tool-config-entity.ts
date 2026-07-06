import { BaseModelSchema } from '@activepieces/core-utils'
import { AiToolCapability, AiToolProvider, AiToolProviderConfig, Platform } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { z } from 'zod'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'
import { EncryptedObject } from '../helper/encryption'

const AiToolConfigEncrypted = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    capability: z.enum(AiToolCapability),
    provider: z.enum(AiToolProvider),
    auth: EncryptedObject,
    config: AiToolProviderConfig.nullable(),
    enabled: z.boolean().default(false),
})
type AiToolConfigEncrypted = z.infer<typeof AiToolConfigEncrypted>

export type AiToolConfigSchema = AiToolConfigEncrypted & {
    platform: Platform
}

export const AiToolConfigEntity = new EntitySchema<AiToolConfigSchema>({
    name: 'ai_tool_config',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        capability: {
            type: String,
            nullable: false,
        },
        provider: {
            type: String,
            nullable: false,
        },
        auth: {
            type: 'json',
            nullable: false,
        },
        config: {
            type: 'json',
            nullable: true,
        },
        enabled: {
            type: Boolean,
            nullable: false,
            default: false,
        },
    },
    indices: [
        {
            name: 'idx_ai_tool_config_platform_capability',
            columns: ['platformId', 'capability'],
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
                foreignKeyConstraintName: 'fk_ai_tool_config_platform_id',
            },
        },
    },
})
