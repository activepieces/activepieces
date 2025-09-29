import { AIUsage } from '@activepieces/common-ai'
import {
    AppConnection,
    Cell,
    Field,
    Flow,
    Folder,
    Platform,
    Project,
    Record,
    Table,
    TableWebhook,
    TriggerEvent,
    User,
} from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
    JSONB_COLUMN_TYPE,
    TIMESTAMP_COLUMN_TYPE,
} from '../database/database-common'

type ProjectSchema = Project & {
    owner: User
    flows: Flow[]
    files: File[]
    folders: Folder[]
    events: TriggerEvent[]
    appConnections: AppConnection[]
    platform: Platform
    tables: Table[]
    fields: Field[]
    records: Record[]
    cells: Cell[]
    tableWebhooks: TableWebhook[]
    aiUsage: AIUsage[]
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
        releasesEnabled: {
            type: Boolean,
            nullable: false,
            default: false,
        },
        metadata: {
            type: JSONB_COLUMN_TYPE,
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
            where: 'deleted IS NULL',
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
        tables: {
            type: 'one-to-many',
            target: 'table',
            inverseSide: 'project',
        },
        fields: {
            type: 'one-to-many',
            target: 'field',
            inverseSide: 'project',
        },
        records: {
            type: 'one-to-many',
            target: 'record',
            inverseSide: 'project',
        },
        cells: {
            type: 'one-to-many',
            target: 'cell',
            inverseSide: 'project',
        },
        tableWebhooks: {
            type: 'one-to-many',
            target: 'table_webhook',
            inverseSide: 'project',
        },
        aiUsage: {
            type: 'one-to-many',
            target: 'ai_usage',
            inverseSide: 'project',
        },
    },
})
