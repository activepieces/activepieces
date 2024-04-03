import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../database/database-common'
import { ApiKey } from '@activepieces/ee-shared'
import { Platform } from '@activepieces/shared'

type ApiKeySchema = ApiKey & {
    platform: Platform
}

export const ApiKeyEntity = new EntitySchema<ApiKeySchema>({
    name: 'api_key',
    columns: {
        ...BaseColumnSchemaPart,
        displayName: {
            type: String,
            nullable: false,
        },
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        hashedValue: {
            type: String,
            nullable: false,
        },
        truncatedValue: {
            type: String,
            nullable: false,
        },
    },
    indices: [],
    relations: {
        platform: {
            type: 'many-to-one',
            target: 'platform',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'platformId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_api_key_platform_id',
            },
        },
    },
})
