import { Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../../database/database-common'
import { Waitpoint, WaitpointStatus, WaitpointType } from './waitpoint-types'

type WaitpointSchema = Waitpoint & {
    project: Project
}

export const WaitpointEntity = new EntitySchema<WaitpointSchema>({
    name: 'waitpoint',
    columns: {
        ...BaseColumnSchemaPart,
        flowRunId: {
            ...ApIdSchema,
            nullable: false,
        },
        projectId: {
            ...ApIdSchema,
            nullable: false,
        },
        type: {
            type: String,
            nullable: false,
            enum: WaitpointType,
        },
        status: {
            type: String,
            nullable: false,
            enum: WaitpointStatus,
        },
        resumeDateTime: {
            type: 'timestamp with time zone',
            nullable: true,
        },
        timeoutSeconds: {
            type: Number,
            nullable: true,
        },
        responseToSend: {
            type: 'jsonb',
            nullable: true,
        },
        workerHandlerId: {
            type: String,
            nullable: true,
        },
        httpRequestId: {
            type: String,
            nullable: true,
        },
        stepName: {
            type: String,
            nullable: false,
        },
        resumePayload: {
            type: 'jsonb',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_waitpoint_flow_run_id_step_name',
            columns: ['flowRunId', 'stepName'],
            unique: true,
        },
        {
            name: 'idx_waitpoint_project_id',
            columns: ['projectId'],
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
                foreignKeyConstraintName: 'fk_waitpoint_project_id',
            },
        },
    },
})
