import { Project, ApRecord, Table } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart, JSONB_COLUMN_TYPE } from '../../database/database-common'

export type RecordSchema = ApRecord & {
    table: Table
    project: Project,
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
        cells: {
            type: JSONB_COLUMN_TYPE,
            nullable: true,
        }
    },
    indices: [
        {
            name: 'idx_record_project_id_table_id',
            columns: ['projectId', 'tableId'],
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
        }
    },
})