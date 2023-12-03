import { EntitySchema } from 'typeorm'
import { ProjectMember } from '@activepieces/ee-shared'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'
import { Project, User } from '@activepieces/shared'

export type ProjectMemberSchema = ProjectMember & {
    user: User
    project: Project
}

export const ProjectMemberEntity = new EntitySchema<ProjectMemberSchema>({
    name: 'project_member',
    columns: {
        ...BaseColumnSchemaPart,
        email: {
            type: String,
        },
        platformId: {
            type: String,
            nullable: true,
        },
        userId: {
            ...ApIdSchema,
            nullable: true,
        },
        projectId: ApIdSchema,
        role: {
            type: String,
        },
        status: {
            type: String,
        },
    },
    indices: [
        {
            name: 'idx_project_member_project_id_user_id',
            columns: ['projectId', 'userId'],
            unique: true,
        },
        {
            name: 'idx_project_member_project_id_email',
            columns: ['projectId', 'email'],
            unique: true,
        },
    ],
    relations: {
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
    },
})
