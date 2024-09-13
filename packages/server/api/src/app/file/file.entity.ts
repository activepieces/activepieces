import { File, FileCompression, FileType, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import {
    ApIdSchema,
    BaseColumnSchemaPart,
    BLOB_COLUMN_TYPE,
} from '../database/database-common'

type FileSchema = File & {
    project: Project
}

export const FileEntity = new EntitySchema<FileSchema>({
    name: 'file',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: { ...ApIdSchema, nullable: true },
        platformId: { ...ApIdSchema, nullable: true },
        data: {
            type: BLOB_COLUMN_TYPE,
            nullable: true,
        },
        location: {
            type: String,
            nullable: false,
        },
        s3Key: {
            type: String,
            nullable: true,
        },
        type: {
            type: String,
            default: FileType.UNKNOWN,
            nullable: false,
        },
        compression: {
            type: String,
            default: FileCompression.NONE,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_file_project_id',
            columns: ['projectId'],
        },
        {
            name: 'idx_file_type_created_desc',
            columns: ['type', 'created'],
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
                foreignKeyConstraintName: 'fk_file_project_id',
            },
        },
    },
})
