import { Cell, Project, Record, Table } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

export type RecordSchema = Record & {
    table: Table
    project: Project
    cells: Cell[]
}

export const RecordEntity = new EntitySchema<RecordSchema>({
    name: 'record',
    columns: {
        ...BaseColumnSchemaPart,
        tableId: {
            ...ApIdSchema,
            nullable: false,
        },
        projectId: {
            ...ApIdSchema,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_record_project_id_table_id',
            columns: ['projectId', 'tableId'],
        },
        {
            name: 'idx_record_table_id_project_id_record_id',
            columns: ['tableId', 'projectId', 'id'],
        },
    ],
    relations: {
        table: {
            type: 'many-to-one',
            target: 'table',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'tableId',
                foreignKeyConstraintName: 'fk_record_table_id',
            },
        },
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_record_project_id',
            },
        },
        cells: {
            type: 'one-to-many',
            target: 'cell',
            inverseSide: 'record',
        },
    },
})