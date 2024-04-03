import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
} from '../../database/database-common'
import { ProjectMember } from '@activepieces/ee-shared'
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
        projectId: ApIdSchema,
        platformId: {
            type: String,
            nullable: true,
        },
        role: {
            type: String,
        },
        status: {
            type: String,
        },
    },
    indices: [
        {
            name: 'idx_project_member_project_id_email_platform_id',
            columns: ['projectId', 'email', 'platformId'],
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
    },
})
