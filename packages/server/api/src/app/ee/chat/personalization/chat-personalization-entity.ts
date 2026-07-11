import { ChatPersonalization, ChatPersonalizationStatus, Platform, User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../../database/database-common'

type ChatPersonalizationWithRelations = ChatPersonalization & {
    platform: Platform
    user: User
}

// A null userId marks the platform-wide COMPANY row; per-user rows carry the
// member's role-targeted result. The two partial unique indexes enforcing
// (platformId, userId) incl. the null case live in the migration — EntitySchema
// cannot express partial indexes.
export const ChatPersonalizationEntity = new EntitySchema<ChatPersonalizationWithRelations>({
    name: 'chat_personalization',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        userId: {
            ...ApIdSchema,
            nullable: true,
        },
        domain: {
            type: String,
            nullable: true,
        },
        role: {
            type: String,
            nullable: true,
        },
        status: {
            type: String,
            nullable: false,
            default: ChatPersonalizationStatus.PENDING,
        },
        profile: {
            type: 'jsonb',
            nullable: true,
        },
        useCases: {
            type: 'jsonb',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_chat_personalization_platform',
            columns: ['platformId'],
        },
        {
            name: 'idx_chat_personalization_platform_user',
            columns: ['platformId', 'userId'],
            unique: true,
            where: '"userId" IS NOT NULL',
        },
        {
            name: 'idx_chat_personalization_platform_company',
            columns: ['platformId'],
            unique: true,
            where: '"userId" IS NULL',
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
                foreignKeyConstraintName: 'fk_chat_personalization_platform_id',
            },
        },
        user: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'userId',
                foreignKeyConstraintName: 'fk_chat_personalization_user_id',
            },
        },
    },
})
