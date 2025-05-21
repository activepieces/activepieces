import { File, Project, ProjectRelease, ProjectReleaseType, User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../../database/database-common'

export type ProjectReleaseSchema = ProjectRelease & {
    user: User
    project: Project
    file: File
}

export const ProjectReleaseEntity = new EntitySchema<ProjectReleaseSchema>({
    name: 'project_release',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: {
            type: String,
            nullable: false,
        },
        name: {
            type: String,
            nullable: false,
        },
        description: {
            type: String,
            nullable: true,
        },
        importedBy: {
            ...ApIdSchema,
            nullable: true,
        },
        fileId: {
            type: String,
            nullable: false,
        },
        type: {
            type: String,
            enum: ProjectReleaseType,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_project_release_project_id',
            columns: ['projectId'],
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
                foreignKeyConstraintName: 'fk_project_release_project_id',
            },
        },
        user: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'SET NULL',
            joinColumn: {
                name: 'importedBy',
                foreignKeyConstraintName: 'fk_project_release_imported_by',
            },
        },
        file: {
            type: 'many-to-one',
            target: 'file',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'fileId',
                foreignKeyConstraintName: 'fk_project_release_file_id',
            },
        },
    },
})
