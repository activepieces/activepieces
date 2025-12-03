import { BaseModelSchema, Platform } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../../database/database-common'
import { Static, Type } from '@sinclair/typebox'

export const OpenRouterApiKey = Type.Object({
    ...BaseModelSchema,
    platformId: Type.String(),
    apiKey: Type.String(),
    creditLimit: Type.Union([Type.Number(), Type.Null()]),
})
export type OpenRouterApiKey = Static<typeof OpenRouterApiKey>

export type OpenRouterApiKeySchema = OpenRouterApiKey & {
    platform: Platform
}

export const OpenRouterApiKeyEntity = new EntitySchema<OpenRouterApiKeySchema>({
    name: 'openrouter_api_key',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            ...ApIdSchema,
            unique: true,
            nullable: false,
        },
        apiKey: {
            type: String,
            nullable: false,
        },
        creditLimit: {
            type: Number,
            nullable: true,
        },
    },
    relations: {
        platform: {
            type: 'many-to-one',
            target: 'platform',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'platformId',
                foreignKeyConstraintName: 'fk_openrouter_api_key_platform_id',
            },
        },
    },
})
