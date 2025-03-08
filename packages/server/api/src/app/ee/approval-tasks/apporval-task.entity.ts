import { ApprovalTask, ApprovalTaskComment } from '@activepieces/ee-shared'
import { Project, Flow, User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
    JSONB_COLUMN_TYPE,
} from '../../database/database-common'

export type ApprovalTaskSchema = ApprovalTask & {
    project: Project
    flow: Flow
    assignedUser: User
}

export const ApprovalTaskEntity = new EntitySchema<ApprovalTaskSchema>({
    name: 'approval_task',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,  
        flowId: ApIdSchema,
        assignedUserId: ApIdSchema,
        options: {
            type: JSONB_COLUMN_TYPE,
            nullable: false,
        },
        selectedOption: {
            type: String,
        },
        title: {
            type: String,
            nullable: false,
        },
        description: {
            type: String,
        },
    },
    indices: [
        {
            name: 'idx_approval_task_project_id',
            columns: ['projectId'],
        },
        {
            name: 'idx_approval_task_flow_id',
            columns: ['flowId'],
        },
        {
            name: 'idx_approval_task_assigned_user_id',
            columns: ['assignedUserId'],
        },
    ],
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            nullable: true,
            joinColumn: {
                name: 'projectId',
            },
        },
        flow: {
            type: 'many-to-one',
            target: 'flow',
            cascade: true,
            onDelete: 'CASCADE',
            nullable: true,
            joinColumn: {
                name: 'flowId',
            },
        },
        assignedUser: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'CASCADE',
            nullable: true,
            joinColumn: {
                name: 'assignedUserId',
            },
        },
    },
})

export type ApprovalTaskCommentSchema = ApprovalTaskComment & {
    task: ApprovalTask
    user: User
}

export const ApprovalTaskCommentEntity = new EntitySchema<ApprovalTaskCommentSchema>({
    name: 'approval_task_comment',
    columns: {
        ...BaseColumnSchemaPart,
        taskId: ApIdSchema,
        userId: ApIdSchema,
        comment: {
            type: String,
        },
    },
    indices: [
        {
            name: 'idx_approval_task_comment_task_id',
            columns: ['taskId'],
        },
        {
            name: 'idx_approval_task_comment_user_id',
            columns: ['userId'],
        },
    ],
    relations: {
        task: {
            type: 'many-to-one',
            target: 'approval_task',
            cascade: true,
            onDelete: 'CASCADE',
            nullable: true,
            joinColumn: {
                name: 'taskId',
            },
        },
    },
})


