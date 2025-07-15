import {
    Agent,
    AgentRun,
    Project,
} from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    ARRAY_COLUMN_TYPE,
    BaseColumnSchemaPart,
    isPostgres,
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
        steps: {
            type: ARRAY_COLUMN_TYPE,
            array: isPostgres(),
        },
        message: {
            type: String,
            nullable: true,
        },
        startTime: {
            type: TIMESTAMP_COLUMN_TYPE,
        },
        finishTime: {
            nullable: true,
            type: TIMESTAMP_COLUMN_TYPE,
        },
    },
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