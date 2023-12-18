import { EntitySchema } from 'typeorm'
import { GitRepo } from '@activepieces/ee-shared'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'
import { Project } from '@activepieces/shared'


type GitRepoSchema = GitRepo & {
    project: Project
}

export const GitRepoEntity = new EntitySchema<GitRepoSchema>({
    name: 'git_repo',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: ApIdSchema,
    },
    indices: [
        {
            name: 'idx_plan_project_id',
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
                foreignKeyConstraintName: 'fk_project_project_id',
            },
        },
    },
})
