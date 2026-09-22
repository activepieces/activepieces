import { PlatformId, ProjectRole } from '@activepieces/core-utils'
import { ProjectMember } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart } from '../../../database/database-common'

export type ProjectRoleSchema = ProjectRole & {
    name: string
    permissions: string[]
    platformId: PlatformId
    projectMembers: ProjectMember[]
}

export const ProjectRoleEntity = new EntitySchema<ProjectRoleSchema>({
    name: 'project_role',
    indices: [
        {
            name: 'idx_project_role_platform_id_name',
            columns: ['platformId', 'name'],
            unique: true,
            where: '"platformId" IS NOT NULL',
        },
    ],
    columns: {
        ...BaseColumnSchemaPart,
        name: {
            type: String,
            nullable: false,
        },
        permissions: {
            type: String,
            array: true,
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