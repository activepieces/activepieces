import { ChatConversation } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../database/database-common'

export type ChatConversationSchema = ChatConversation

export const ChatConversationEntity = new EntitySchema<ChatConversationSchema>({
    name: 'chat_conversation',
    tableName: 'chat_conversation',

    columns: {
        ...BaseColumnSchemaPart,
        title: {
            type: String,
            nullable: false,
        },
        sessionId: {
            ...ApIdSchema,
            nullable: false,
        },
        conversation: {
            type: 'jsonb',
            nullable: false,
        },
    },

    indices: [],

    relations: {
        sessionId: {
            type: 'many-to-one',
            target: 'chat_session',
            onDelete: 'CASCADE',
            onUpdate: 'RESTRICT',
            joinColumn: {
                name: 'sessionId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_chat_conversation_session',
            },
        },
    },
})
