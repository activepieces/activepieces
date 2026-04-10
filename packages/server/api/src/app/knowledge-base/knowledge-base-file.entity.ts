import { File, KnowledgeBaseFile, Project } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
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
