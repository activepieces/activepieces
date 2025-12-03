import {
    File,
    Flow,
    FlowRun,
    FlowVersion,
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
    flowVersion: FlowVersion
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
        logsFileId: {
            ...ApIdSchema,
            nullable: true,
        },
        parentRunId: {
            ...ApIdSchema,
            nullable: true,
        },
        failParentOnFailure: {
            type: Boolean,
            nullable: false,
            default: true,
        },
        status: {
            type: String,
        },
        tags: {
            type: ARRAY_COLUMN_TYPE,
            array: isPostgres(),
            nullable: true,
        },
        startTime: {
            type: TIMESTAMP_COLUMN_TYPE,
            nullable: true,
        },
        finishTime: {
            nullable: true,
            type: TIMESTAMP_COLUMN_TYPE,
        },
        pauseMetadata: {
            type: JSONB_COLUMN_TYPE,
            nullable: true,
        },
        failedStep: {
            type: JSONB_COLUMN_TYPE,
            nullable: true,
        },
        archivedAt: {
            type: String,
            nullable: true,
            default: null,
        },
        stepNameToTest: {
            type: String,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_run_project_id_environment_archived_at_created_desc',
            columns: ['projectId', 'environment', 'archivedAt', 'created'],
        },
        {
            name: 'idx_run_project_id_environment_status_archived_at_created_desc',
            columns: ['projectId', 'environment', 'status', 'archivedAt', 'created'],
        },
        {
            name: 'idx_run_project_id_flow_id_environment_archived_at_created_desc',
            columns: ['projectId', 'flowId', 'environment', 'archivedAt', 'created'],
        },
        {
            name: 'idx_run_project_id_flow_id_environment_status_archived_at_created_desc',
            columns: ['projectId', 'flowId', 'environment', 'status', 'archivedAt', 'created'],
        },
        {
            name: 'idx_run_flow_id',
            columns: ['flowId'],
        },
        {
            name: 'idx_run_logs_file_id',
            columns: ['logsFileId'],
        },
        {
            name: 'idx_run_parent_run_id',
            columns: ['parentRunId'],
        },
        {
            name: 'idx_run_flow_version_id',
            columns: ['flowVersionId'],
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
        flowVersion: {
            type: 'many-to-one',
            target: 'flow_version',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'flowVersionId',
                foreignKeyConstraintName: 'fk_flow_run_flow_version_id',
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