import { EntitySchema } from 'typeorm'
import { ApIdSchema, BaseColumnSchemaPart } from '../database/database-common'

type PlatformCopilotChunkSchema = {
    id: string
    created: string
    updated: string
    platformId: string
    sourceType: string
    sourceUrl: string
    sourceTitle: string
    content: string
    chunkIndex: number
    embedding: string | null
    embeddingModel: string | null
    metadata: object | null
}

export const PlatformCopilotChunkEntity = new EntitySchema<PlatformCopilotChunkSchema>({
    name: 'platform_copilot_chunk',
    columns: {
        ...BaseColumnSchemaPart,
        platformId: {
            ...ApIdSchema,
            nullable: false,
        },
        sourceType: {
            type: String,
            nullable: false,
        },
        sourceUrl: {
            type: String,
            nullable: false,
        },
        sourceTitle: {
            type: String,
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
        embeddingModel: {
            type: String,
            nullable: true,
        },
        metadata: {
            type: 'jsonb',
            nullable: true,
        },
    },
    indices: [
        {
            name: 'idx_pc_chunk_platform',
            columns: ['platformId'],
        },
    ],
})
