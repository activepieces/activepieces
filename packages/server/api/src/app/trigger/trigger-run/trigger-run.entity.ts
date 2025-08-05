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
            name: 'idx_trigger_run_project_id_trigger_source_id_status',
            columns: ['projectId', 'triggerSourceId'],
            unique: false,
        },
        {
            name: 'idx_trigger_run_platform_id_project_id_trigger_source_id',
            columns: ['platformId', 'projectId', 'triggerSourceId'],
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
        flow: {
            type: 'many-to-one',
            target: 'flow',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'flowId',
                foreignKeyConstraintName: 'fk_trigger_run_flow_id',
            },
        },
    },
})
