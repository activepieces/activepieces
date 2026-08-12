import { AIProviderName, BaseModelSchema } from '@activepieces/core-utils'
import { AIProviderConfig, AiProviderModelScope, AiProviderProjectScope, Platform } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { z } from 'zod'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'
import { EncryptedObject } from '../helper/encryption'

const AIProviderEncrypted = z.object({
    ...BaseModelSchema,
    displayName: z.string().min(1),
    platformId: z.string(),
    provider: z.nativeEnum(AIProviderName),
    auth: EncryptedObject,
    config: AIProviderConfig,
    enabledForChat: z.boolean().default(false),
    modelScope: AiProviderModelScope.default('all'),
    modelIds: z.array(z.string()).default([]),
    projectScope: AiProviderProjectScope.default('all'),
    projectIds: z.array(z.string()).default([]),
})
type AIProviderEncrypted = z.infer<typeof AIProviderEncrypted>

export type AIProviderSchema = AIProviderEncrypted & {
    platform: Platform
    provider: AIProviderName
}

export const AIProviderEntity = new EntitySchema<AIProviderSchema>({
    name: 'ai_provider',
    columns: {
        ...BaseColumnSchemaPart,
        config: {
            type: 'json',
            nullable: false,
        },
        auth: {
            type: 'json',
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
        displayName: {
            type: String,
            nullable: false,
        },
        enabledForChat: {
            type: Boolean,
            nullable: false,
            default: false,
        },
        modelScope: {
            type: String,
            nullable: false,
            default: 'all',
        },
        modelIds: {
            type: String,
            array: true,
            nullable: false,
        },
        projectScope: {
            type: String,
            nullable: false,
            default: 'all',
        },
        projectIds: {
            type: String,
            array: true,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_ai_provider_platform_id_provider',
            columns: ['platformId', 'provider'],
        },
        {
            name: 'idx_ai_provider_project_ids_gin',
            columns: ['projectIds'],
            synchronize: false,
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
