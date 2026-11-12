import { AgentConversation, Platform, SubagentTask } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

type AgentTaskWithRelations = SubagentTask & {
    claimId: string | null
    platform: Platform
    conversation: AgentConversation
}

export const AgentTaskEntity = new EntitySchema<AgentTaskWithRelations>({
    name: 'agent_task',
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
        conversationId: {
            ...ApIdSchema,
            nullable: false,
        },
        title: {
            type: String,
            nullable: false,
        },
        status: {
            type: String,
            nullable: false,
        },
        messages: {
            type: 'jsonb',
            nullable: false,
            default: '[]',
        },
        summary: {
            type: String,
            nullable: true,
        },
        artifacts: {
            type: 'jsonb',
            nullable: false,
            default: '[]',
        },
        claimId: {
            ...ApIdSchema,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_agent_task_platform_conversation_created',
            columns: ['platformId', 'conversationId', 'created'],
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
                foreignKeyConstraintName: 'fk_agent_task_platform_id',
            },
        },
        conversation: {
            type: 'many-to-one',
            target: 'agent_conversation',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'conversationId',
                foreignKeyConstraintName: 'fk_agent_task_conversation_id',
            },
        },
    },
})
