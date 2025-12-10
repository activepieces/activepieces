import {
    AppConnection,
    AppConnectionStatus,
    User,
    UserIdentity,
} from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    BaseColumnSchemaPart,
} from '../database/database-common'
import { EncryptedObject } from '../helper/encryption'

export type AppConnectionSchema = Omit<AppConnection, 'value'> & {
    value: EncryptedObject
    owner?: (User & { identity?: UserIdentity })
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
        projectIds: {
            type: String,
            array: true,
            nullable: false,
        },
        scope: {
            type: String,
        },
        value: {
            type: 'jsonb',
        },
        metadata: {
            type: 'jsonb',
            nullable: true,
        },
        pieceVersion: {
            type: String,
        },
    },
    indices: [
        {
            name: 'idx_app_connection_platform_id_and_external_id',
            columns: ['platformId', 'externalId'],
        },
        {
            name: 'idx_app_connection_owner_id',
            columns: ['ownerId'],
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
        },
    },
})
