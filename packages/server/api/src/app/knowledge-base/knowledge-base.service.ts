import { ActivepiecesError, apId, ErrorCode, KnowledgeBaseFile } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { databaseConnection } from '../database/database-connection'
import { fileService } from '../file/file.service'
import { KnowledgeBaseChunkEntity } from './knowledge-base-chunk.entity'
import { KnowledgeBaseFileEntity } from './knowledge-base-file.entity'

const kbFileRepo = repoFactory(KnowledgeBaseFileEntity)
const kbChunkRepo = repoFactory(KnowledgeBaseChunkEntity)

const CHUNK_SIZE_CHARS = 2000
const CHUNK_OVERLAP_CHARS = 200

function chunkText(text: string): string[] {
    const chunks: string[] = []
    let start = 0
    while (start < text.length) {
        const end = Math.min(start + CHUNK_SIZE_CHARS, text.length)
        chunks.push(text.slice(start, end))
        if (end >= text.length) break
        start = end - CHUNK_OVERLAP_CHARS
    }
    return chunks
}

async function extractTextFromFile(data: Buffer, fileName: string): Promise<string> {
    const lowerName = (fileName ?? '').toLowerCase()

    if (lowerName.endsWith('.pdf')) {
        const pdfParse = (await import('pdf-parse')).default
        const result = await pdfParse(new Uint8Array(data), { version: 'v2.0.550' })
        return result.text
    }

    // TXT, CSV, and other text-based formats
    return data.toString('utf-8')
}

export const knowledgeBaseService = (log: FastifyBaseLogger) => ({
    async ingestFile(params: IngestFileParams): Promise<void> {
        const { projectId, knowledgeBaseFileId, embedFn } = params

        const textChunks = await this.extractChunks({ projectId, knowledgeBaseFileId })
        if (textChunks.length === 0) {
            return
        }

        // Embed in batches to respect API limits
        const EMBED_BATCH_SIZE = 50
        const allChunks: StoreEmbeddingsParams['chunks'] = []
        for (let i = 0; i < textChunks.length; i += EMBED_BATCH_SIZE) {
            const batch = textChunks.slice(i, i + EMBED_BATCH_SIZE)
            const embeddings = await embedFn(batch)
            if (embeddings.length !== batch.length) {
                throw new Error(`Embedding count mismatch: expected ${batch.length}, got ${embeddings.length}`)
            }
            for (let j = 0; j < batch.length; j++) {
                allChunks.push({
                    content: batch[j],
                    embedding: embeddings[j],
                    chunkIndex: i + j,
                    metadata: { chunkIndex: i + j, totalChunks: textChunks.length },
                })
            }
        }

        await this.storeEmbeddings({ projectId, knowledgeBaseFileId, chunks: allChunks })
    },

    async search(params: SearchParams): Promise<SearchResult[]> {
        const { projectId, knowledgeBaseFileIds, queryEmbedding, limit } = params
        const embeddingStr = `[${queryEmbedding.join(',')}]`

        const queryRunner = databaseConnection()
        const results = await queryRunner.query(
            `SELECT kbc.id, kbc.content, kbc.metadata, kbc."chunkIndex",
                    kbc.embedding <=> $1::vector AS distance
             FROM knowledge_base_chunk kbc
             WHERE kbc."projectId" = $2
               AND kbc."knowledgeBaseFileId" = ANY($3)
             ORDER BY distance
             LIMIT $4`,
            [embeddingStr, projectId, knowledgeBaseFileIds, limit],
        )

        return results.map((row: { id: string, content: string, metadata: Record<string, unknown>, chunkIndex: number, distance: number }) => ({
            id: row.id,
            content: row.content,
            metadata: row.metadata,
            chunkIndex: row.chunkIndex,
            score: 1 - row.distance,
        }))
    },

    async listFiles(params: { projectId: string }): Promise<KnowledgeBaseFile[]> {
        return kbFileRepo().find({
            where: { projectId: params.projectId },
            order: { created: 'DESC' },
        })
    },

    async createFile(params: CreateFileParams): Promise<KnowledgeBaseFile> {
        const kbFile = {
            id: apId(),
            projectId: params.projectId,
            fileId: params.fileId,
            displayName: params.displayName,
        }
        return kbFileRepo().save(kbFile)
    },

    async deleteFile(params: { projectId: string, id: string }): Promise<void> {
        await kbFileRepo().delete({
            id: params.id,
            projectId: params.projectId,
        })
    },

    async getFileOrThrow(params: { projectId: string, id: string }): Promise<KnowledgeBaseFile> {
        const file = await kbFileRepo().findOneBy({
            id: params.id,
            projectId: params.projectId,
        })
        if (!file) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'KnowledgeBaseFile',
                    entityId: params.id,
                },
            })
        }
        return file
    },

    async getChunkCount(params: { knowledgeBaseFileId: string }): Promise<number> {
        return kbChunkRepo().count({ where: { knowledgeBaseFileId: params.knowledgeBaseFileId } })
    },

    async extractChunks(params: { projectId: string, knowledgeBaseFileId: string }): Promise<string[]> {
        const kbFile = await kbFileRepo().findOneBy({
            id: params.knowledgeBaseFileId,
            projectId: params.projectId,
        })
        if (!kbFile) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'KnowledgeBaseFile',
                    entityId: params.knowledgeBaseFileId,
                },
            })
        }

        const fileData = await fileService(log).getDataOrThrow({
            projectId: params.projectId,
            fileId: kbFile.fileId,
        })

        const text = await extractTextFromFile(fileData.data, fileData.fileName ?? '')
        return chunkText(text)
    },

    async storeEmbeddings(params: StoreEmbeddingsParams): Promise<void> {
        const { projectId, knowledgeBaseFileId, chunks } = params

        // Delete existing chunks for idempotent re-ingestion
        await kbChunkRepo().delete({ knowledgeBaseFileId })

        if (chunks.length === 0) {
            return
        }

        const chunkEntities = chunks.map((chunk) => ({
            id: apId(),
            projectId,
            knowledgeBaseFileId,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            embedding: `[${chunk.embedding.join(',')}]`,
            metadata: chunk.metadata ?? {},
        }))

        // Insert in batches to avoid oversized queries
        const BATCH_SIZE = 100
        for (let i = 0; i < chunkEntities.length; i += BATCH_SIZE) {
            await kbChunkRepo().insert(chunkEntities.slice(i, i + BATCH_SIZE))
        }
    },

    async getFilesByIds(params: { projectId: string, ids: string[] }): Promise<KnowledgeBaseFile[]> {
        if (params.ids.length === 0) return []
        return kbFileRepo().find({
            where: params.ids.map(id => ({
                id,
                projectId: params.projectId,
            })),
        })
    },
})

type IngestFileParams = {
    projectId: string
    knowledgeBaseFileId: string
    embedFn: (texts: string[]) => Promise<number[][]>
}

type SearchParams = {
    projectId: string
    knowledgeBaseFileIds: string[]
    queryEmbedding: number[]
    limit: number
}

type SearchResult = {
    id: string
    content: string
    metadata: Record<string, unknown>
    chunkIndex: number
    score: number
}

type CreateFileParams = {
    projectId: string
    fileId: string
    displayName: string
}

type StoreEmbeddingsParams = {
    projectId: string
    knowledgeBaseFileId: string
    chunks: {
        content: string
        embedding: number[]
        chunkIndex: number
        metadata?: Record<string, unknown>
    }[]
}
