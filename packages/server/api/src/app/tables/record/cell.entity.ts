import { Cell, Field, Record } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

type CellSchema = Cell & {
    record: Record
    field: Field
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
        value: {
            type: 'varchar',
        },
    },
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
    },
})