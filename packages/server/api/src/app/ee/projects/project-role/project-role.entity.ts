import { ProjectMember } from '@activepieces/ee-shared'
import { PlatformId, ProjectRole } from '@activepieces/shared'
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
    relations: {
        projectMembers: {
            type: 'many-to-one',
            target: 'project_member',
            onDelete: 'CASCADE',
            cascade: true,
            joinColumn: {
                name: 'id',
                referencedColumnName: 'projectRoleId',
                foreignKeyConstraintName: 'fk_project_role_project_member_id',
            },
        },
    },
})