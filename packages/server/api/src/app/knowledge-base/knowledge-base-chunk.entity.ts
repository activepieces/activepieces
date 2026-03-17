import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart, ApIdSchema } from '../database/database-common'
import { KnowledgeBaseFile } from '@activepieces/shared'

type KnowledgeBaseChunkSchema = {
    id: string
    created: string
    updated: string
    projectId: string
    knowledgeBaseFileId: string
    content: string
    chunkIndex: number
    embedding: string
    metadata: Record<string, unknown>
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
        // pgvector vectors are serialized as text strings through TypeORM;
        // the actual column type is vector(1536) defined in the migration.
        embedding: {
            type: String,
            nullable: false,
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
