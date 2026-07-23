import {
    ActionRun,
    File,
    Project,
    User,
} from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../database/database-common'

type ActionRunSchema = ActionRun & {
    project: Project
    logsFile: File
    user: User
}

export const ActionRunEntity = new EntitySchema<ActionRunSchema>({
    name: 'action_run',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        platformId: ApIdSchema,
        userId: {
            ...ApIdSchema,
            nullable: true,
        },
        kind: {
            type: String,
        },
        pieceName: {
            type: String,
            nullable: true,
        },
        pieceVersion: {
            type: String,
            nullable: true,
        },
        actionName: {
            type: String,
            nullable: true,
        },
        connectionExternalId: {
            type: String,
            nullable: true,
        },
        conversationId: {
            ...ApIdSchema,
            nullable: true,
        },
        source: {
            type: String,
        },
        status: {
            type: String,
        },
        input: {
            type: 'jsonb',
            nullable: true,
            select: false,
        },
        output: {
            type: 'jsonb',
            nullable: true,
            select: false,
        },
        logs: {
            type: 'text',
            nullable: true,
            select: false,
        },
        errorMessage: {
            type: 'text',
            nullable: true,
        },
        startTime: {
            type: 'timestamp with time zone',
            nullable: true,
        },
        finishTime: {
            type: 'timestamp with time zone',
            nullable: true,
        },
        logsFileId: {
            ...ApIdSchema,
            nullable: true,
        },
        archivedAt: {
            type: String,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_action_run_project_id_created_archived_at',
            columns: ['projectId', 'created', 'archivedAt'],
        },
        {
            name: 'idx_action_run_created',
            columns: ['created'],
        },
        {
            name: 'idx_action_run_project_id_status_created',
            columns: ['projectId', 'status', 'created'],
        },
        {
            name: 'idx_action_run_project_id_source_created',
            columns: ['projectId', 'source', 'created'],
        },
        {
            name: 'idx_action_run_project_id_user_id_created',
            columns: ['projectId', 'userId', 'created'],
        },
        {
            name: 'idx_action_run_project_id_piece_name_created',
            columns: ['projectId', 'pieceName', 'created'],
        },
        {
            name: 'idx_action_run_conversation_id',
            columns: ['conversationId'],
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
                foreignKeyConstraintName: 'fk_action_run_project_id',
            },
        },
        logsFile: {
            type: 'many-to-one',
            target: 'file',
            cascade: true,
            onDelete: 'SET NULL',
            joinColumn: {
                name: 'logsFileId',
                foreignKeyConstraintName: 'fk_action_run_logs_file_id',
            },
        },
        user: {
            type: 'many-to-one',
            target: 'user',
            onDelete: 'SET NULL',
            joinColumn: {
                name: 'userId',
                foreignKeyConstraintName: 'fk_action_run_user_id',
            },
        },
    },
})
