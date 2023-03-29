import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../helper/base-entity'
import { File, Project } from '@activepieces/shared'

interface FileSchema extends File {
    project: Project;
}

export const FileEntity = new EntitySchema<FileSchema>({
    name: 'file',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: { ...ApIdSchema, nullable: true },
        data: {
            type: 'bytea',
            nullable: false,
        },
    },
    relations: {
        project: {
            type: 'many-to-one',
            target: 'project',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'projectId',
                foreignKeyConstraintName: 'fk_file_project_id',
            },
        },
    },
})
