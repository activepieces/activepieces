import { PlatformId, ProjectRole } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ARRAY_COLUMN_TYPE, BaseColumnSchemaPart, isPostgres } from '../../database/database-common'

export type ProjectRoleSchema = ProjectRole & {
    name: string
    permissions: string[]
    platformId: PlatformId
}

export const ProjectRoleEntity = new EntitySchema<ProjectRoleSchema>({
    name: 'project_role',
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