import {
    Agent,
    AgentSettings,
} from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
    JSON_COLUMN_TYPE,
} from '../../database/database-common'

type AgentSettingsSchema = AgentSettings & {
    agent: Agent
}

export const AgentSettingsEntity = new EntitySchema<AgentSettingsSchema>({
    name: 'agent_settings',
    columns: {
        ...BaseColumnSchemaPart,
        agentId: {
            ...ApIdSchema,
            nullable: false,
        },
        aiMode: {
            type: Boolean,
            nullable: false,
        },
        triggerOnNewRow: {
            type: Boolean,
            nullable: false,
        },
        triggerOnFieldUpdate: {
            type: Boolean,
            nullable: false,
        },
        allowAgentCreateColumns: {
            type: Boolean,
            nullable: false,
        },
        limitColumnEditing: {
            type: Boolean,
            nullable: false,
        },
        editableColumns: {
            type: JSON_COLUMN_TYPE,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_agent_settings_agent_id',
            columns: ['agentId'],
            unique: true,
        },
    ],
    relations: {
        agent: {
            type: 'one-to-one',
            target: 'agent',
            inverseSide: 'settings',
            orphanedRowAction: 'delete',
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'agentId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_agent_settings_agent_id',
            },
        },
    },
})