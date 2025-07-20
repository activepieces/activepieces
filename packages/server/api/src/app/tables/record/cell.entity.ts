import { Cell, Field, Project, Record } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

type CellSchema = Cell & {
    record: Record
    field: Field
    project: Project
}

export const CellEntity = new EntitySchema<CellSchema>({
    name: 'cell',
    columns: {
        ...BaseColumnSchemaPart,
        recordId: {
            ...ApIdSchema,
            nullable: false,
        },
        fieldId: {
            ...ApIdSchema,
            nullable: false,
        },
        projectId: {
            ...ApIdSchema,
            nullable: false,
        },
        value: {
            type: 'varchar',
        },
    },
    indices: [
        {
            name: 'idx_cell_project_id_field_id_record_id_unique',
            columns: ['projectId', 'fieldId', 'recordId'],
            unique: true,
        },
    ],
    relations: {
        record: {
            type: 'many-to-one',
            target: 'record',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'recordId',
                foreignKeyConstraintName: 'fk_cell_record_id',
            },
        },
        field: {
            type: 'many-to-one',
            target: 'field',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'fieldId',
                foreignKeyConstraintName: 'fk_cell_field_id',
            },
        },
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_cell_project_id',
            },
        },
    },
})