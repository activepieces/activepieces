import {
    AppConnection,
    AppConnectionStatus,
    User,
} from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ARRAY_COLUMN_TYPE,
    BaseColumnSchemaPart,
    isPostgres,
    JSONB_COLUMN_TYPE,
    ApIdSchema,
} from '../database/database-common'
import { EncryptedObject } from '../helper/encryption'

export type AppConnectionSchema = Omit<AppConnection, 'value'> & {
    value: EncryptedObject
    owner: User
    mcpId?: string
}

export const AppConnectionEntity = new EntitySchema<AppConnectionSchema>({
    name: 'app_connection',
    columns: {
        ...BaseColumnSchemaPart,
        displayName: {
            type: String,
        },
        externalId: {
            type: String,
        },
        type: {
            type: String,
        },
        status: {
            type: String,
            default: AppConnectionStatus.ACTIVE,
        },
        platformId: {
            type: String,
            nullable: false,
        },
        pieceName: {
            type: String,
        },
        ownerId: {
            type: String,
            nullable: true,
        },
        mcpId: {
            ...ApIdSchema,
            nullable: true,
        },
        projectIds: {
            type: ARRAY_COLUMN_TYPE,
            array: isPostgres(),
            nullable: false,
        },
        scope: {
            type: String,
        },
        value: {
            type: JSONB_COLUMN_TYPE,
        },
    },
    indices: [
        {
            name: 'idx_app_connection_project_ids_and_external_id',
            columns: ['projectIds', 'externalId'],
        },
        {
            name: 'idx_app_connection_platform_id',
            columns: ['platformId'],
        },
        {
            name: 'idx_app_connection_owner_id',
            columns: ['ownerId'],
        },
        {
            name: 'idx_app_connection_mcp_id',
            columns: ['mcpId'],
        },
    ],
    relations: {
        owner: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'SET NULL',
            joinColumn: {
                name: 'ownerId',
                foreignKeyConstraintName: 'fk_app_connection_owner_id',
            },
        }
    },
})
