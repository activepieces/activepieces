import { ChatSession } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../database/database-common'

export const ChatSessionEntity = new EntitySchema<ChatSession>({
    name: 'chat_session',
    tableName: 'chat_session',

    columns: {
        ...BaseColumnSchemaPart,
        userId: {
            ...ApIdSchema,
            nullable: false,
        },
        conversation: {
            type: 'jsonb',
            nullable: false,
        },
        state: {
            type: 'jsonb',
            nullable: false,
        },
        modelId: {
            type: String,
            nullable: false,
        },
        tools: {
            type: 'jsonb',
            nullable: false,
        },
    },

    indices: [],

    relations: {
        userId: {
            type: 'many-to-one',
            target: 'user',
            onDelete: 'RESTRICT',
            onUpdate: 'RESTRICT',
            joinColumn: {
                name: 'userId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_chat_session_user',
            },
        },
    },
})
