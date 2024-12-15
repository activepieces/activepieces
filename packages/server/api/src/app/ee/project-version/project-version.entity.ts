import { File, Project, ProjectVersion, User } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common'

export type ProjectVersionSchema = ProjectVersion & {
    user: User
    project: Project
    file: File
}

export const ProjectVersionEntity = new EntitySchema<ProjectVersionSchema>({
    name: 'project_version',
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
    },
    indices: [
        {
            name: 'idx_project_version_project_id',
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
                foreignKeyConstraintName: 'fk_project_version_project_id',
            },
        },
        user: {
            type: 'many-to-one',
            target: 'user',
            cascade: true,
            onDelete: 'SET NULL',
            joinColumn: {
                name: 'importedBy',
                foreignKeyConstraintName: 'fk_project_version_imported_by',
            },
        },
        file: {
            type: 'many-to-one',
            target: 'file',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'fileId',
                foreignKeyConstraintName: 'fk_project_version_file_id',
            },
        },
    },
})
