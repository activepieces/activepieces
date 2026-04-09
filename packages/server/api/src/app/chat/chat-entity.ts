import { ChatMessageRole } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'

type ChatConversationSchema = {
    id: string
    created: string
    updated: string
    projectId: string
    userId: string
    title: string | null
    modelProvider: string | null
    modelName: string | null
}

type ChatMessageSchema = {
    id: string
    created: string
    updated: string
    conversationId: string
    role: ChatMessageRole
    content: string
    toolCalls: unknown
    fileUrls: string[] | null
    tokenUsage: unknown
}

export const ChatConversationEntity = new EntitySchema<ChatConversationSchema>({
    name: 'chat_conversation',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: {
            ...ApIdSchema,
            nullable: false,
        },
        userId: {
            ...ApIdSchema,
            nullable: false,
        },
        title: {
            type: String,
            nullable: true,
        },
        modelProvider: {
            type: String,
            nullable: true,
        },
        modelName: {
            type: String,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_chat_conversation_project_id',
            columns: ['projectId'],
        },
        {
            name: 'idx_chat_conversation_user_id',
            columns: ['userId'],
        },
    ],
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_chat_conversation_project_id',
            },
        },
        user: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'userId',
                foreignKeyConstraintName: 'fk_chat_conversation_user_id',
            },
        },
    },
})

export const ChatMessageEntity = new EntitySchema<ChatMessageSchema>({
    name: 'chat_message',
    columns: {
        ...BaseColumnSchemaPart,
        conversationId: {
            ...ApIdSchema,
            nullable: false,
        },
        role: {
            type: String,
            nullable: false,
        },
        content: {
            type: 'text',
            nullable: false,
        },
        toolCalls: {
            type: 'jsonb',
            nullable: true,
        },
        fileUrls: {
            type: String,
            array: true,
            nullable: true,
        },
        tokenUsage: {
            type: 'jsonb',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_chat_message_conversation_id',
            columns: ['conversationId'],
        },
    ],
    relations: {
        conversation: {
            type: 'many-to-one',
            target: 'chat_conversation',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'conversationId',
                foreignKeyConstraintName: 'fk_chat_message_conversation_id',
            },
        },
    },
})
