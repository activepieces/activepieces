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

export const ChatRolloutUserEntity = new EntitySchema<ChatRolloutUser>({
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
})
