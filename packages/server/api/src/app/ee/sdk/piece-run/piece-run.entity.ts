import { PieceRun, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../../database/database-common'

type PieceRunSchema = PieceRun & {
    project: Project
}

export const PieceRunEntity = new EntitySchema<PieceRunSchema>({
    name: 'piece_run',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        platformId: ApIdSchema,
        pieceName: {
            type: String,
        },
        pieceVersion: {
            type: String,
        },
        actionName: {
            type: String,
        },
        connectionExternalId: {
            type: String,
            nullable: true,
        },
        input: {
            type: 'jsonb',
        },
        output: {
            type: 'jsonb',
            nullable: true,
        },
        status: {
            type: String,
        },
        errorMessage: {
            type: String,
            nullable: true,
        },
        startTime: {
            type: 'timestamp with time zone',
        },
        finishTime: {
            type: 'timestamp with time zone',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_piece_run_project_id_created',
            columns: ['projectId', 'created'],
        },
        {
            name: 'idx_piece_run_project_id_piece_name_created',
            columns: ['projectId', 'pieceName', 'created'],
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
                foreignKeyConstraintName: 'fk_piece_run_project_id',
            },
        },
    },
})
