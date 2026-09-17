import { BarrierSignalStatus } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'
import { Waitpoint, WaitpointSignal } from './waitpoint-types'

type WaitpointSignalSchema = WaitpointSignal & {
    waitpoint: Waitpoint
}

export const WaitpointSignalEntity = new EntitySchema<WaitpointSignalSchema>({
    name: 'waitpoint_signal',
    columns: {
        ...BaseColumnSchemaPart,
        waitpointId: {
            ...ApIdSchema,
            nullable: false,
        },
        projectId: {
            ...ApIdSchema,
            nullable: false,
        },
        status: {
            type: String,
            nullable: false,
            enum: BarrierSignalStatus,
        },
        refId: {
            type: String,
            nullable: true,
        },
        sequence: {
            type: Number,
            nullable: true,
        },
        label: {
            type: String,
            nullable: true,
        },
        result: {
            type: 'jsonb',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_waitpoint_signal_waitpoint_id_project_id_status',
            columns: ['waitpointId', 'projectId', 'status'],
        },
        {
            name: 'idx_waitpoint_signal_ref_id',
            columns: ['refId'],
        },
        {
            name: 'idx_waitpoint_signal_waitpoint_id_sequence',
            columns: ['waitpointId', 'sequence'],
            unique: true,
            where: '"sequence" IS NOT NULL',
        },
    ],
    relations: {
        waitpoint: {
            type: 'many-to-one',
            target: 'waitpoint',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'waitpointId',
                foreignKeyConstraintName: 'fk_waitpoint_signal_waitpoint_id',
            },
        },
    },
})
