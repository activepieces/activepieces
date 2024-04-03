import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart, TIMESTAMP_COLUMN_TYPE } from '../database/database-common'
import {
    AppConnection,
    Flow,
    Folder,
    Platform,
    Project,
    TriggerEvent,
    User,
} from '@activepieces/shared'

type ProjectSchema = Project & {
    owner: User
    flows: Flow[]
    files: File[]
    folders: Folder[]
    events: TriggerEvent[]
    appConnections: AppConnection[]
    platform: Platform
}

export const ProjectEntity = new EntitySchema<ProjectSchema>({
    name: 'project',
    columns: {
        ...BaseColumnSchemaPart,
        deleted: {
            type: TIMESTAMP_COLUMN_TYPE,
            deleteDate: true,
            nullable: true,
        },
        ownerId: ApIdSchema,
        displayName: {
            type: String,
        },
        notifyStatus: {
            type: String,
        },
        platformId: {
            ...ApIdSchema,
        },
        externalId: {
            type: String,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_project_owner_id',
            columns: ['ownerId'],
            unique: false,
        },
        {
            name: 'idx_project_platform_id_external_id',
            columns: ['platformId', 'externalId'],
            unique: true,
        },
    ],
    relations: {
        owner: {
            type: 'many-to-one',
            target: 'user',
            joinColumn: {
                name: 'ownerId',
                foreignKeyConstraintName: 'fk_project_owner_id',
            },
        },
        platform: {
            type: 'many-to-one',
            target: 'platform',
            cascade: true,
            onDelete: 'RESTRICT',
            onUpdate: 'RESTRICT',
            joinColumn: {
                name: 'platformId',
                foreignKeyConstraintName: 'fk_project_platform_id',
            },
        },
        folders: {
            type: 'one-to-many',
            target: 'folder',
            inverseSide: 'project',
        },
        appConnections: {
            type: 'one-to-many',
            target: 'app_connection',
            inverseSide: 'project',
        },
        events: {
            type: 'one-to-many',
            target: 'trigger_event',
            inverseSide: 'project',
        },
        files: {
            type: 'one-to-many',
            target: 'file',
            inverseSide: 'project',
        },
        flows: {
            type: 'one-to-many',
            target: 'flow',
            inverseSide: 'project',
        },
    },
})
