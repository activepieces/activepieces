import { Flow, FlowRun, ManualTask, Platform, Project, User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
    JSONB_COLUMN_TYPE,
} from '../database/database-common'

export type ManualTaskSchema = ManualTask & {
    platform: Platform
    project: Project
    flow: Flow
    run: FlowRun
    assignee: User
}

export const ManualTaskEntity = new EntitySchema<ManualTaskSchema>({
    name: 'manual_task',
    columns: {
        ...BaseColumnSchemaPart,
        title: {
            type: String,
            nullable: false,
        },
        description: {
            type: String,
            nullable: true,
        },
        status: {
            type: JSONB_COLUMN_TYPE,
            nullable: false,
        },
        statusOptions: {
            type: JSONB_COLUMN_TYPE,
            nullable: false,
        },
        assigneeId: {
            ...ApIdSchema,
            nullable: true,
        },
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        projectId: {
            ...ApIdSchema,
            nullable: false,
        },
        flowId: {
            ...ApIdSchema,
            nullable: false,
        },
        runId: {
            ...ApIdSchema,
            nullable: true,
        },
        approvalUrl: {
            type: String,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_manual_task_project_id',
            columns: ['projectId'],
        },
        {
            name: 'idx_manual_task_flow_id',
            columns: ['flowId'],
        },
        {
            name: 'idx_manual_task_platform_id',
            columns: ['platformId'],
        },
    ],
    relations: {
        platform: {
            type: 'many-to-one',
            target: 'platform',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'platformId',
                foreignKeyConstraintName: 'fk_manual_task_platform_id',
            },
        },
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_manual_task_project_id',
            },
        },
        flow: {
            type: 'many-to-one',
            target: 'flow',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'flowId',
                foreignKeyConstraintName: 'fk_manual_task_flow_id',
            },
        },
        run: {
            type: 'many-to-one',
            target: 'flow_run',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'runId',
                foreignKeyConstraintName: 'fk_manual_task_run_id',
            },
        },
        assignee: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'assigneeId',
                foreignKeyConstraintName: 'fk_manual_task_assignee_id',
            },
        },
    },
})

