import { Platform, SecretManagerConnection } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'
import { EncryptedObject } from '../../helper/encryption'

export type SecretManagerEntitySchema = Omit<SecretManagerConnection, 'auth'> & {
    platform?: Platform
    auth?: EncryptedObject
    projectIds?: string[]
}

export const SecretManagerEntity = new EntitySchema<SecretManagerEntitySchema>({
    name: 'secret_manager_connection',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        providerId: {
            type: String,
            nullable: false,
        },
        name: {
            type: String,
            nullable: false,
        },
        scope: {
            type: String,
            nullable: false,
            default: 'PLATFORM',
        },
        projectIds: {
            type: 'jsonb',
            nullable: true,
        },
        auth: {
            type: 'jsonb',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_secret_manager_connection_platform_id',
            columns: ['platformId'],
        },
    ],
    relations: {
        platform: {
            type: 'many-to-one',
            target: 'platform',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'platformId',
                foreignKeyConstraintName: 'fk_secret_manager_connection_platform_id',
            },
        },
    },
})
