import { ChatConversation, Platform, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

type ChatConversationWithRelations = ChatConversation & {
    platform: Platform
    project: Project
    user: unknown
}

export const ChatConversationEntity = new EntitySchema<ChatConversationWithRelations>({
    name: 'chat_conversation',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        projectId: {
            ...ApIdSchema,
            nullable: true,
        },
        userId: {
            ...ApIdSchema,
            nullable: false,
        },
        title: {
            type: String,
            nullable: true,
        },
        modelName: {
            type: String,
            nullable: true,
        },
        messages: {
            type: 'jsonb',
            nullable: false,
            default: '[]',
        },
        summary: {
            type: 'text',
            nullable: true,
        },
        summarizedUpToIndex: {
            type: Number,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_chat_conversation_platform_user_created_id',
            columns: ['platformId', 'userId', 'created', 'id'],
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
                foreignKeyConstraintName: 'fk_chat_conversation_platform_id',
            },
        },
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'SET NULL',
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
