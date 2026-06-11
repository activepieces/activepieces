import { Platform, User, UserChatMemory } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

type UserChatMemoryWithRelations = UserChatMemory & {
    platform: Platform
    user: User
}

export const UserChatMemoryEntity = new EntitySchema<UserChatMemoryWithRelations>({
    name: 'user_chat_memory',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        userId: {
            ...ApIdSchema,
            nullable: false,
        },
        memories: {
            type: 'jsonb',
            nullable: false,
            default: '[]',
        },
    },
    indices: [
        {
            name: 'idx_user_chat_memory_platform_user',
            columns: ['platformId', 'userId'],
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
                foreignKeyConstraintName: 'fk_user_chat_memory_platform_id',
            },
        },
        user: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'userId',
                foreignKeyConstraintName: 'fk_user_chat_memory_user_id',
            },
        },
    },
})
