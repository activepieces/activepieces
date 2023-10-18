import { EntitySchema } from 'typeorm'
import { Platform } from '@activepieces/ee-shared'
import { ApIdSchema, BLOB_COLUMN_TYPE, BaseColumnSchemaPart } from '../../database/database-common'
import { User } from '@activepieces/shared'


export const PlatformEntity = new EntitySchema<Platform & { owner: User }>({
    name: 'platform',
    columns: {
        ...BaseColumnSchemaPart,
        primaryColor: {
            type: String,
        },
        ownerId: ApIdSchema,
        logoIcon: {
            type: BLOB_COLUMN_TYPE,
            nullable: true,
        },
        fullLogo: {
            type: BLOB_COLUMN_TYPE,
            nullable: true,
        },
        favIcon: {
            type: BLOB_COLUMN_TYPE,
            nullable: true,
        },
    },
    indices: [

    ],
    relations: {
        owner: {
            type: 'many-to-one',
            target: 'user',
            joinColumn: {
                name: 'ownerId',
                foreignKeyConstraintName: 'fk_platform_owner_id',
            },
        },
    },
})
