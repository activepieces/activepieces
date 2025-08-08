import {
    Agent,
    AgentRun,
    Project,
} from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
    JSONB_COLUMN_TYPE,
    TIMESTAMP_COLUMN_TYPE,
} from '../../database/database-common'

type AgentRunSchema = AgentRun & {
    agent: Agent
    project: Project
}

export const AgentRunEntity = new EntitySchema<AgentRunSchema>({
    name: 'agent_run',
    columns: {
        ...BaseColumnSchemaPart,
        agentId: ApIdSchema,
        projectId: ApIdSchema,
        status: {
            type: String,
            nullable: false,
        },
        output: {
            type: JSONB_COLUMN_TYPE,
            nullable: true,
        },
        metadata: {
            type: JSONB_COLUMN_TYPE,
            nullable: true,
        },
        steps: {
            type: JSONB_COLUMN_TYPE,
            nullable: false,
        },
        message: {
            type: String,
            nullable: true,
        },
        prompt: {
            type: String,
            nullable: false,
        },
        startTime: {
            type: TIMESTAMP_COLUMN_TYPE,
            nullable: true,
        },
        finishTime: {
            nullable: true,
            type: TIMESTAMP_COLUMN_TYPE,
        },
    },
    indices: [
        {
            name: 'idx_agent_run_project_agent_starttime',
            columns: ['projectId', 'agentId', 'startTime'],
        },
    ],
    relations: {
        agent: {
            type: 'many-to-one',
            target: 'agent',
            inverseSide: 'runs',
            onDelete: 'CASCADE',
            nullable: false,
        },
        project: {
            type: 'many-to-one',
            target: 'project',
            inverseSide: 'runs',
            onDelete: 'CASCADE',
            nullable: false,
        },
    },
})