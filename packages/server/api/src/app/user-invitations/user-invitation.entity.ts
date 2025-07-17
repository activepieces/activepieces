import { Project, ProjectRole, UserInvitation } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart } from '../database/database-common'

type UserInvitationSchema = UserInvitation & {
    project?: Project
    projectRole?: ProjectRole
}
export const UserInvitationEntity = new EntitySchema<UserInvitationSchema>({
    name: 'user_invitation',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            type: String,
            nullable: false,
        },
        type: {
            type: String,
            nullable: false,
        },
        platformRole: {
            type: String,
            nullable: true,
        },
        email: {
            type: String,
        },
        projectId: {
            type: String,
            nullable: true,
        },
        status: {
            type: String,
            nullable: false,
        },
        projectRoleId: {
            type: String,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_user_invitation_email_platform_project',
            columns: ['email', 'platformId', 'projectId'],
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
                foreignKeyConstraintName: 'fk_user_invitation_project_id',
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
                foreignKeyConstraintName: 'fk_user_invitation_project_role_id',
            },
        },
    },
})
