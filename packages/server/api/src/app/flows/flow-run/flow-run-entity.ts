import {
    File,
    Flow,
    FlowRun,
    Project,
} from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    ARRAY_COLUMN_TYPE,
    BaseColumnSchemaPart,
    isPostgres,
    JSONB_COLUMN_TYPE,
    TIMESTAMP_COLUMN_TYPE,
} from '../../database/database-common'

type FlowRunSchema = FlowRun & {
    project: Project
    flow: Flow
    logsFile: File
}

export const FlowRunEntity = new EntitySchema<FlowRunSchema>({
    name: 'flow_run',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        flowId: ApIdSchema,
        flowVersionId: ApIdSchema,
        environment: {
            type: String,
            nullable: true,
        },
        flowDisplayName: {
            type: String,
        },
        logsFileId: { 
            ...ApIdSchema, 
            nullable: true,
        },
        status: {
            type: String,
        },
        terminationReason: {
            type: String,
            nullable: true,
        },
        tags: {
            type: ARRAY_COLUMN_TYPE,
            array: isPostgres(),
            nullable: true,
        },
        duration: {
            nullable: true,
            type: Number,
        },
        tasks: {
            nullable: true,
            type: Number,
        },
        startTime: {
            type: TIMESTAMP_COLUMN_TYPE,
        },
        finishTime: {
            nullable: true,
            type: TIMESTAMP_COLUMN_TYPE,
        },
        pauseMetadata: {
            type: JSONB_COLUMN_TYPE,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_run_project_id_environment_created_desc',
            columns: ['projectId', 'environment', 'created'],
        },
        {
            name: 'idx_run_project_id_environment_status_created_desc',
            columns: ['projectId', 'environment', 'status', 'created'],
        },
        {
            name: 'idx_run_project_id_flow_id_environment_created_desc',
            columns: ['projectId', 'flowId', 'environment', 'created'],
        },
        {
            name: 'idx_run_project_id_flow_id_environment_status_created_desc',
            columns: ['projectId', 'flowId', 'environment', 'status', 'created'],
        },
        {
            name: 'idx_run_flow_id',
            columns: ['flowId'],
        },
        {
            name: 'idx_run_logs_file_id',
            columns: ['logsFileId'],
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
                foreignKeyConstraintName: 'fk_flow_run_project_id',
            },
        },
        flow: {
            type: 'many-to-one',
            target: 'flow',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'flowId',
                foreignKeyConstraintName: 'fk_flow_run_flow_id',
            },
        },
        logsFile: {
            type: 'many-to-one',
            target: 'file',
            cascade: true,
            onDelete: 'SET NULL',
            joinColumn: {
                name: 'logsFileId',
                foreignKeyConstraintName: 'fk_flow_run_logs_file_id',
            },
        },
    },
})
