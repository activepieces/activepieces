import { EntitySchema } from 'typeorm'
import { File, KnowledgeBaseFile, KnowledgeBaseFileStatus, Project } from '@activepieces/shared'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'

type KnowledgeBaseFileSchema = KnowledgeBaseFile & {
    project: Project
    file: File
}

export const KnowledgeBaseFileEntity = new EntitySchema<KnowledgeBaseFileSchema>({
    name: 'knowledge_base_file',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: {
            ...ApIdSchema,
            nullable: false,
        },
        fileId: {
            ...ApIdSchema,
            nullable: false,
        },
        displayName: {
            type: String,
            nullable: false,
        },
        status: {
            type: String,
            default: KnowledgeBaseFileStatus.PENDING,
            nullable: false,
        },
        error: {
            type: String,
            nullable: true,
        },
        chunkCount: {
            type: Number,
            default: 0,
            nullable: false,
        },
    },
    indices: [
        {
            name: 'idx_kb_file_project_id',
            columns: ['projectId'],
        },
        {
            name: 'idx_kb_file_file_id',
            columns: ['fileId'],
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
                foreignKeyConstraintName: 'fk_kb_file_project_id',
            },
        },
        file: {
            type: 'many-to-one',
            target: 'file',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'fileId',
                foreignKeyConstraintName: 'fk_kb_file_file_id',
            },
        },
    },
})
