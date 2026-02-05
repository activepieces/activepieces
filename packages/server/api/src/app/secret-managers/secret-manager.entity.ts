import { Platform, SecretManager } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../database/database-common'
import { EncryptedObject } from '../helper/encryption'

export type SecretManagerEntitySchema = Omit<SecretManager, 'auth'> & {
    platform?: Platform
    auth?: EncryptedObject
}

export const SecretManagerEntity = new EntitySchema<SecretManagerEntitySchema>({
    name: 'secret_manager',
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
        auth: {
            type: 'jsonb',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_secret_manager_platform_id',
            columns: ['platformId'],
        },
    ],
    uniques: [
        {
            name: 'idx_secret_manager_platform_id_provider_id',
            columns: ['platformId', 'providerId'],
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
                foreignKeyConstraintName: 'fk_secret_manager_platform_id',
            },
        },
    },
})
