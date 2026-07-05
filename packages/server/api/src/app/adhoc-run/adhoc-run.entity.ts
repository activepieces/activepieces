import {
    AdhocRun,
    File,
    Project,
    User,
} from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../database/database-common'

type AdhocRunSchema = AdhocRun & {
    project: Project
    logsFile: File
    user: User
}

export const AdhocRunEntity = new EntitySchema<AdhocRunSchema>({
    name: 'adhoc_run',
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
        },
        output: {
            type: 'jsonb',
            nullable: true,
        },
        logs: {
            type: 'text',
            nullable: true,
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
            name: 'idx_adhoc_run_project_id_created',
            columns: ['projectId', 'created'],
        },
        {
            name: 'idx_adhoc_run_project_id_created_archived_at',
            columns: ['projectId', 'created', 'archivedAt'],
        },
        {
            name: 'idx_adhoc_run_created',
            columns: ['created'],
        },
        {
            name: 'idx_adhoc_run_project_id_status',
            columns: ['projectId', 'status'],
        },
        {
            name: 'idx_adhoc_run_project_id_piece_name_created',
            columns: ['projectId', 'pieceName', 'created'],
        },
        {
            name: 'idx_adhoc_run_user_id',
            columns: ['userId'],
        },
        {
            name: 'idx_adhoc_run_conversation_id',
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
                foreignKeyConstraintName: 'fk_adhoc_run_project_id',
            },
        },
        logsFile: {
            type: 'many-to-one',
            target: 'file',
            cascade: true,
            onDelete: 'SET NULL',
            joinColumn: {
                name: 'logsFileId',
                foreignKeyConstraintName: 'fk_adhoc_run_logs_file_id',
            },
        },
        user: {
            type: 'many-to-one',
            target: 'user',
            onDelete: 'SET NULL',
            joinColumn: {
                name: 'userId',
                foreignKeyConstraintName: 'fk_adhoc_run_user_id',
            },
        },
    },
})
