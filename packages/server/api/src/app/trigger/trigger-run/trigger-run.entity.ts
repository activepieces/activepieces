import { File, Flow, Platform, Project, TriggerRun, TriggerSource } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../database/database-common'

type TriggerRunSchema = {
    payloadFile: File
    flow: Flow
    project: Project
    platform: Platform
    triggerSource: TriggerSource
} & TriggerRun

export const TriggerRunEntity = new EntitySchema<TriggerRunSchema>({
    name: 'trigger_run',
    columns: {
        ...BaseColumnSchemaPart,
        payloadFileId: {
            type: String,
            nullable: true,
        },
        jobId: {
            type: String,
            nullable: false,
        },
        pieceName: {
            type: String,
            nullable: false,
        },
        pieceVersion: {
            type: String,
            nullable: false,
        },
        error: {
            type: String,
            nullable: true,
        },
        status: {
            type: String,
        },
        triggerSourceId: ApIdSchema,
        projectId: ApIdSchema,
        platformId: ApIdSchema,
    },
    indices: [
        {
            name: 'idx_trigger_run_job_id',
            columns: ['jobId'],
            unique: true,
        },
        {
            name: 'idx_trigger_run_project_id_trigger_source_id_status',
            columns: ['projectId', 'triggerSourceId'],
            unique: false,
        },
        {
            name: 'idx_created_piece_name_platform_id',
            columns: ['created', 'platformId', 'pieceName'],
            unique: false,
        },
        {
            name: 'idx_trigger_run_trigger_source_id',
            columns: ['triggerSourceId'],
            unique: false,
        },
        {
            name: 'idx_trigger_run_payload_file_id',
            columns: ['payloadFileId'],
            unique: false,
        },
    ],
    relations: {
        triggerSource: {
            type: 'many-to-one',
            target: 'trigger_source',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'triggerSourceId',
                foreignKeyConstraintName: 'fk_trigger_run_trigger_source_id',
            },
        },
        platform: {
            type: 'many-to-one',
            target: 'platform',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'platformId',
                foreignKeyConstraintName: 'fk_trigger_run_platform_id',
            },
        },
        payloadFile: {
            type: 'one-to-one',
            target: 'file',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'payloadFileId',
                foreignKeyConstraintName: 'fk_trigger_run_payload_file_id',
            },
        },
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_trigger_run_project_id',
            },
        },
    },
})
