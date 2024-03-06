import { EntitySchema } from 'typeorm'
import { GitRepo } from '@activepieces/ee-shared'
import { Project } from '@activepieces/shared'
import { ApIdSchema, BaseColumnSchemaPart, JSONB_COLUMN_TYPE } from '../../database/database-common'

type GitRepoSchema = GitRepo & {
    project: Project
}

export const GitRepoEntity = new EntitySchema<GitRepoSchema>({
    name: 'git_repo',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
        remoteUrl: {
            type: String,
            nullable: false,
        },
        branch: {
            type: String,
            nullable: false,
        },
        sshPrivateKey: {
            type: String,
            nullable: true,
        },
        slug: {
            type: String,
            nullable: false,
        },
        mapping: {
            type: JSONB_COLUMN_TYPE,
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_git_repo_project_id',
            columns: ['projectId'],
            unique: true,
        },
    ],
    relations: {
        project: {
            type: 'one-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                referencedColumnName: 'id',
                foreignKeyConstraintName: 'fk_git_repo_project_id',
            },
        },
    },
})
