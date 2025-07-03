import { Flow, Project, Table, TableWebhook } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, ARRAY_COLUMN_TYPE, BaseColumnSchemaPart, isPostgres } from '../../database/database-common'

type TableWebhookSchema = TableWebhook & {
    project: Project
    table: Table
    flow: Flow
}

export const TableWebhookEntity = new EntitySchema<TableWebhookSchema>({
    name: 'table_webhook',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: {
            ...ApIdSchema,
            nullable: false,
        },
        tableId: {
            ...ApIdSchema,
            nullable: false,
        },
        events: {
            type: ARRAY_COLUMN_TYPE,
            array: isPostgres(),
        },
        flowId: {
            ...ApIdSchema,
            nullable: false,
        },
    },
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_table_webhook_project_id',
            },
        },
        table: {
            type: 'many-to-one',
            target: 'table',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'tableId',
                foreignKeyConstraintName: 'fk_table_webhook_table_id',
            },
        },
        flow: {
            type: 'many-to-one',
            target: 'flow',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'flowId',
                foreignKeyConstraintName: 'fk_table_webhook_flow_id',
            },
        },
    },
})
