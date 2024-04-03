import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
    JSONB_COLUMN_TYPE,
} from '../../database/database-common'
import {
    Flow,
    FlowRun,
    FlowStatus,
    FlowVersion,
    Folder,
    Project,
    TriggerEvent,
} from '@activepieces/shared'

export type FlowSchema = Flow & {
    versions: FlowVersion[]
    project: Project
    runs: FlowRun[]
    folder?: Folder
    events: TriggerEvent[]
    publishedVersion?: FlowVersion
}

export const FlowEntity = new EntitySchema<FlowSchema>({
    name: 'flow',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: {
            ...ApIdSchema,
            nullable: false,
        },
        folderId: {
            ...ApIdSchema,
            nullable: true,
        },
        status: {
            type: String,
            enum: FlowStatus,
            nullable: false,
            default: FlowStatus.DISABLED,
        },
        schedule: {
            type: JSONB_COLUMN_TYPE,
            nullable: true,
        },
        publishedVersionId: {
            ...ApIdSchema,
            nullable: true,
            unique: true,
        },
    },
    indices: [
        {
            name: 'idx_flow_project_id',
            columns: ['projectId'],
            unique: false,
        },
        {
            name: 'idx_flow_folder_id',
            columns: ['folderId'],
            unique: false,
        },
    ],
    relations: {
        runs: {
            type: 'one-to-many',
            target: 'flow_run',
            inverseSide: 'flow',
        },
        folder: {
            type: 'many-to-one',
            target: 'folder',
            onDelete: 'SET NULL',
            nullable: true,
            joinColumn: {
                name: 'folderId',
                foreignKeyConstraintName: 'fk_flow_folder_id',
            },
        },
        events: {
            type: 'one-to-many',
            target: 'trigger_event',
            inverseSide: 'flow',
        },
        versions: {
            type: 'one-to-many',
            target: 'flow_version',
            inverseSide: 'flow',
        },
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_flow_project_id',
            },
        },
        publishedVersion: {
            type: 'one-to-one',
            target: 'flow_version',
            nullable: true,
            onDelete: 'RESTRICT',
            joinColumn: {
                name: 'publishedVersionId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_flow_published_version',
            },
        },
    },
})
