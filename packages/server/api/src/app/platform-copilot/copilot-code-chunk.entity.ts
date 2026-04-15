import { EntitySchema } from 'typeorm'
import { BaseColumnSchemaPart } from '../database/database-common'

export const CopilotCodeChunkEntity = new EntitySchema<CopilotCodeChunkSchema>({
    name: 'copilot_code_chunks',
    columns: {
        ...BaseColumnSchemaPart,
        path: {
            type: 'text',
            nullable: false,
        },
        language: {
            type: String,
            nullable: true,
        },
        content: {
            type: 'text',
            nullable: false,
        },
        summary: {
            type: 'text',
            nullable: true,
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
        startLine: {
            type: Number,
            nullable: false,
        },
        endLine: {
            type: Number,
            nullable: false,
        },
        functionName: {
            type: String,
            nullable: true,
        },
        className: {
            type: String,
            nullable: true,
        },
        chunkType: {
            type: String,
            nullable: false,
        },
        tokens: {
            type: Number,
            nullable: true,
        },
        searchVector: {
            type: 'tsvector',
            nullable: true,
            select: false,
        },
    },
    indices: [
        {
            name: 'idx_copilot_code_chunks_path',
            columns: ['path'],
        },
    ],
})

type CopilotCodeChunkSchema = {
    id: string
    created: string
    updated: string
    path: string
    language: string | null
    content: string
    summary: string | null
    embedding: string | null
    embeddingModel: string | null
    startLine: number
    endLine: number
    functionName: string | null
    className: string | null
    chunkType: string
    tokens: number | null
    searchVector: string | null
}
