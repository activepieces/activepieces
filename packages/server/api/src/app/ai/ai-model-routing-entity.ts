import { AiModelRoutingConfig, Platform } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'

export type AiModelRoutingSchema = AiModelRoutingConfig & {
    platform: Platform
}

export const AiModelRoutingEntity = new EntitySchema<AiModelRoutingSchema>({
    name: 'ai_model_routing',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        tiers: {
            type: 'jsonb',
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_ai_model_routing_platform_id',
            columns: ['platformId'],
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
                foreignKeyConstraintName: 'fk_ai_model_routing_platform_id',
            },
        },
    },
})
