import { KnowledgeBaseFile } from '@activepieces/shared'
import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'

type KnowledgeBaseChunkSchema = {
    id: string
    created: string
    updated: string
    projectId: string
    knowledgeBaseFileId: string
    content: string
    chunkIndex: number
    embedding: string | null
    metadata: object
    knowledgeBaseFile: KnowledgeBaseFile
}

export const KnowledgeBaseChunkEntity = new EntitySchema<KnowledgeBaseChunkSchema>({
    name: 'knowledge_base_chunk',
    columns: {
        ...BaseColumnSchemaPart,
        projectId: {
            ...ApIdSchema,
            nullable: false,
        },
        knowledgeBaseFileId: {
            ...ApIdSchema,
            nullable: false,
        },
        content: {
            type: 'text',
            nullable: false,
        },
        chunkIndex: {
            type: Number,
            nullable: false,
        },
        embedding: {
            type: 'vector',
            length: '768',
            nullable: true,
        },
        metadata: {
            type: 'jsonb',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_kb_chunk_project_file',
            columns: ['projectId', 'knowledgeBaseFileId'],
        },
    ],
    relations: {
        knowledgeBaseFile: {
            type: 'many-to-one',
            target: 'knowledge_base_file',
            cascade: true,
            onDelete: 'CASCADE',
            joinColumn: {
                name: 'knowledgeBaseFileId',
                foreignKeyConstraintName: 'fk_kb_chunk_kb_file_id',
            },
        },
    },
})
