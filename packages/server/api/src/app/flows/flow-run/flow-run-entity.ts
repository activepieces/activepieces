import {
    File,
    Flow,
    FlowRun,
    FlowVersion,
    Project,
    User,
} from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../database/database-common'

type FlowRunSchema = FlowRun & {
    project: Project
    flow: Flow
    flowVersion: FlowVersion
    logsFile: File
    triggeredByUser?: User
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
            type: String,
            array: true,
            nullable: true,
        },
        startTime: {
            type: 'timestamp with time zone',
            nullable: true,
        },
        triggeredBy: {
            type: String,
            nullable: true,
        },
        finishTime: {
            nullable: true,
            type: 'timestamp with time zone',
        },
        pauseMetadata: {
            type: 'jsonb',
            nullable: true,
        },
        failedStep: {
            type: 'jsonb',
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
        stepsCount: {
            type: Number,
            nullable: false,
            default: 0,
        },
    },
    indices: [
        {
            name: 'idx_run_project_id_environment_flow_id_status_created_archived_',
            columns: ['projectId', 'environment', 'flowId', 'status', 'created', 'archivedAt'],
        },
        {
            name: 'idx_run_project_id_environment_status_created_archived_at',
            columns: ['projectId', 'environment', 'status', 'created', 'archivedAt'],
        },
        {
            name: 'idx_run_project_id_environment_created_archived_at',
            columns: ['projectId', 'environment', 'created', 'archivedAt'],
        },
        {
            name: 'idx_run_project_id_environment_flow_id_created_archived_at',
            columns: ['projectId', 'environment', 'flowId', 'created', 'archivedAt'],
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
        triggeredByUser: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'SET NULL',
            joinColumn: {
                name: 'triggeredBy',
                foreignKeyConstraintName: 'fk_flow_run_triggered_by_user_id',
            },
        },
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