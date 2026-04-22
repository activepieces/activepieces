import { ChatConversation, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'

type ChatConversationWithRelations = ChatConversation & {
    project: Project
    user: unknown
}

export const ChatConversationEntity = new EntitySchema<ChatConversationWithRelations>({
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
        sandboxSessionId: {
            type: String,
            nullable: true,
        },
        modelName: {
            type: String,
            nullable: true,
        },
        totalInputTokens: {
            type: Number,
            default: 0,
        },
        totalOutputTokens: {
            type: Number,
            default: 0,
        },
        summary: {
            type: 'text',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_chat_conversation_project_user_created',
            columns: ['projectId', 'userId', 'created'],
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
