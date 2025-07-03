import { Flow, FlowRun, Platform, Project, Todo, User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
    JSONB_COLUMN_TYPE,
} from '../database/database-common'

export type TodoSchema = Todo & {
    platform: Platform
    project: Project
    flow: Flow
    run: FlowRun
    assignee: User
    createdByUser: User
}

export const TodoEntity = new EntitySchema<TodoSchema>({
    name: 'todo',
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
        environment: {
            type: String,
            nullable: false,
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
        createdByUserId: {
            ...ApIdSchema,
            nullable: true,
        },
        flowId: {
            ...ApIdSchema,
            nullable: true,
        },
        runId: {
            ...ApIdSchema,
            nullable: true,
        },
        resolveUrl: {
            type: String,
            nullable: true,
        },
        locked: {
            type: Boolean,
            nullable: false,
            default: false,
        },
    },
    indices: [
        {
            name: 'idx_todo_project_id',
            columns: ['projectId'],
        },
        {
            name: 'idx_todo_flow_id',
            columns: ['flowId'],
        },
        {
            name: 'idx_todo_platform_id',
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
                foreignKeyConstraintName: 'fk_todo_platform_id',
            },
        },
        createdByUser: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'CASCADE',
        },
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_todo_project_id',
            },
        },
        flow: {
            type: 'many-to-one',
            target: 'flow',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'flowId',
                foreignKeyConstraintName: 'fk_todo_flow_id',
            },
        },
        run: {
            type: 'many-to-one',
            target: 'flow_run',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'runId',
                foreignKeyConstraintName: 'fk_todo_run_id',
            },
        },
        assignee: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'assigneeId',
                foreignKeyConstraintName: 'fk_todo_assignee_id',
            },
        },
    },
})
