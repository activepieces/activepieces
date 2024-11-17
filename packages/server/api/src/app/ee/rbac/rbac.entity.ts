import { PlatformId, Rbac } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ARRAY_COLUMN_TYPE, BaseColumnSchemaPart, isPostgres } from '../../database/database-common'

export type RbacSchema = Rbac & {
    name: string
    permissions: string[]
    platformId: PlatformId
}

export const RbacEntity = new EntitySchema<RbacSchema>({
    name: 'rbac',
    columns: {
        ...BaseColumnSchemaPart,
        name: {
            type: String,
            nullable: false,
        },
        permissions: {
            type: ARRAY_COLUMN_TYPE,
            array: isPostgres(),
            nullable: false,
        },
        platformId: {
            type: String,
            nullable: true,
        },
        type: {
            type: String,
            nullable: false,
        },
    },
})