import { Agent, Field, Project, Record, Table, TableWebhook } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

type TableSchema = Table & {
    project: Project
    fields: Field[]
    records: Record[]
    tableWebhooks: TableWebhook[]
    agent: Agent
}

export const TableEntity = new EntitySchema<TableSchema>({
    name: 'table',
    columns: {
        ...BaseColumnSchemaPart,
        name: {
            type: String,
        },
        externalId: {
            type: String,
        },
        agentId: {
            type: String,
            nullable: true,
        },
        trigger: {
            type: String,
            nullable: true,
        },
        status: {
            type: String,
            nullable: true,
        },
        projectId: {
            ...ApIdSchema,
            nullable: false,
        },
    },
    indices: [  
        {
            name: 'idx_table_project_id_name',
            columns: ['projectId', 'name'],
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
                foreignKeyConstraintName: 'fk_table_project_id',
            },
        },
        fields: {
            type: 'one-to-many',
            target: 'field',
            inverseSide: 'table',
        },
        records: {
            type: 'one-to-many',
            target: 'record',
            inverseSide: 'table',
        },
        tableWebhooks: {
            type: 'one-to-many',
            target: 'table_webhook',
            inverseSide: 'table',
        },
        agent: {
            type: 'one-to-one',
            target: 'agent',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'agentId',
                foreignKeyConstraintName: 'fk_table_agent_id',
            },
        },
    },
})
