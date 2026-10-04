import { Platform, PlatformModelTier } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'

export type PlatformModelTierSchema = PlatformModelTier & {
    platform: Platform
}

export const PlatformModelTierEntity = new EntitySchema<PlatformModelTierSchema>({
    name: 'platform_model_tier',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        name: {
            type: String,
            nullable: false,
        },
        emoji: {
            type: String,
            nullable: false,
        },
        description: {
            type: String,
            nullable: true,
        },
        position: {
            type: Number,
            nullable: false,
            default: 0,
        },
        entries: {
            type: 'jsonb',
            nullable: false,
        },
        isDefault: {
            type: Boolean,
            nullable: false,
            default: false,
        },
        thinkingBudget: {
            type: Number,
            nullable: true,
        },
        deleted: {
            type: 'timestamp with time zone',
            deleteDate: true,
            nullable: true,
        },
        replacedBy: {
            ...ApIdSchema,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_platform_model_tier_platform_id',
            columns: ['platformId'],
        },
        {
            name: 'idx_platform_model_tier_platform_name_live',
            columns: ['platformId', 'name'],
            unique: true,
            synchronize: false,
        },
        {
            name: 'idx_platform_model_tier_platform_default',
            columns: ['platformId'],
            unique: true,
            where: '"isDefault" = true AND "deleted" IS NULL',
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
                foreignKeyConstraintName: 'fk_platform_model_tier_platform_id',
            },
        },
    },
})
