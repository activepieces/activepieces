import { Platform, User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

type ChatRolloutUser = {
    id: string
    created: string
    updated: string
    userId: string
    platformId: string
    landedAt: string | null
    chattedAt: string | null
}

type ChatRolloutUserWithRelations = ChatRolloutUser & {
    user: User
    platform: Platform
}

export const ChatRolloutUserEntity = new EntitySchema<ChatRolloutUserWithRelations>({
    name: 'chat_rollout_user',
    columns: {
        ...BaseColumnSchemaPart,
        userId: {
            ...ApIdSchema,
            nullable: false,
        },
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        landedAt: {
            type: 'timestamp with time zone',
            nullable: true,
        },
        chattedAt: {
            type: 'timestamp with time zone',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_chat_rollout_user_user_id',
            columns: ['userId'],
            unique: true,
        },
        {
            name: 'idx_chat_rollout_user_chatted',
            columns: ['chattedAt'],
            where: '"chattedAt" IS NOT NULL',
        },
        {
            name: 'idx_chat_rollout_user_landed',
            columns: ['landedAt'],
            where: '"landedAt" IS NOT NULL',
        },
    ],
    relations: {
        user: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'userId',
                foreignKeyConstraintName: 'fk_chat_rollout_user_user_id',
            },
        },
        platform: {
            type: 'many-to-one',
            target: 'platform',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'platformId',
                foreignKeyConstraintName: 'fk_chat_rollout_user_platform_id',
            },
        },
    },
})
