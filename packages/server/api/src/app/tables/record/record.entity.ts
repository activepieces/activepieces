import { Cell, Record, Table } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

type RecordSchema = Record & {
    table: Table
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
    },
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
        cells: {
            type: 'one-to-many',
            target: 'cell',
            inverseSide: 'record',
        },
    },
})