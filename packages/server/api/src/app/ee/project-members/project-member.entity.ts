import { ProjectMember } from '@activepieces/ee-shared'
import { Project, ProjectRole, User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../database/database-common'

export type ProjectMemberSchema = ProjectMember & {
    user: User
    project: Project
    projectRole: ProjectRole
}

export const ProjectMemberEntity = new EntitySchema<ProjectMemberSchema>({
    name: 'project_member',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        platformId: ApIdSchema,
        userId: ApIdSchema,
        projectRoleId: ApIdSchema,
    },
    indices: [
        {
            name: 'idx_project_member_project_id_user_id_platform_id',
            columns: ['projectId', 'userId', 'platformId'],
            unique: true,
        },
    ],
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_project_member_project_id',
            },
        },
        user: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'userId',
                foreignKeyConstraintName: 'fk_project_member_user_id',
            },
        },
        projectRole: {
            type: 'many-to-one',
            target: 'project_role',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectRoleId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_project_member_project_role_id',
            },
        },
    },
})
