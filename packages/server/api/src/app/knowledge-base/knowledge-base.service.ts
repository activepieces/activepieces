import { FastifyBaseLogger } from 'fastify'
import { ActivepiecesError, apId, ErrorCode, KnowledgeBaseFile, KnowledgeBaseFileStatus } from '@activepieces/shared'
import { repoFactory } from '../core/db/repo-factory'
import { KnowledgeBaseFileEntity } from './knowledge-base-file.entity'
import { KnowledgeBaseChunkEntity } from './knowledge-base-chunk.entity'
import { fileService } from '../file/file.service'
import { databaseConnection } from '../database/database-connection'

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
        const result = await pdfParse(data)
        return result.text
    }

    // TXT, CSV, and other text-based formats
    return data.toString('utf-8')
}

export const knowledgeBaseService = (log: FastifyBaseLogger) => ({
    async ingestFile(params: IngestFileParams): Promise<void> {
        const { projectId, knowledgeBaseFileId, fileId, embedFn } = params

        try {
            await kbFileRepo().update(
                { id: knowledgeBaseFileId },
                { status: KnowledgeBaseFileStatus.PROCESSING },
            )

            const fileData = await fileService(log).getDataOrThrow({
                projectId,
                fileId,
            })

            // Delete existing chunks for idempotent re-ingestion
            await kbChunkRepo().delete({ knowledgeBaseFileId })

            const text = await extractTextFromFile(fileData.data, fileData.fileName ?? '')
            const chunks = chunkText(text)

            if (chunks.length === 0) {
                await kbFileRepo().update(
                    { id: knowledgeBaseFileId },
                    { status: KnowledgeBaseFileStatus.COMPLETED, chunkCount: 0 },
                )
                return
            }

            // Process in batches to respect API limits and cap memory
            const EMBED_BATCH_SIZE = 50
            for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
                const batch = chunks.slice(i, i + EMBED_BATCH_SIZE)
                const embeddings = await embedFn(batch)
                if (embeddings.length !== batch.length) {
                    throw new Error(`Embedding count mismatch: expected ${batch.length}, got ${embeddings.length}`)
                }

                const chunkEntities = batch.map((content, batchIndex) => ({
                    id: apId(),
                    projectId,
                    knowledgeBaseFileId,
                    content,
                    chunkIndex: i + batchIndex,
                    embedding: `[${embeddings[batchIndex].join(',')}]`,
                    metadata: {
                        fileName: fileData.fileName,
                        chunkIndex: i + batchIndex,
                        totalChunks: chunks.length,
                    },
                }))

                await kbChunkRepo().insert(chunkEntities)
            }

            await kbFileRepo().update(
                { id: knowledgeBaseFileId },
                { status: KnowledgeBaseFileStatus.COMPLETED, chunkCount: chunks.length },
            )
        }
        catch (error) {
            log.error({ error, knowledgeBaseFileId }, '[KnowledgeBaseService#ingestFile] error')
            await kbFileRepo().update(
                { id: knowledgeBaseFileId },
                {
                    status: KnowledgeBaseFileStatus.FAILED,
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            )
        }
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
             ORDER BY kbc.embedding <=> $1::vector
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

    async createFile(params: CreateFileParams): Promise<{ id: string }> {
        const kbFile = {
            id: apId(),
            projectId: params.projectId,
            fileId: params.fileId,
            displayName: params.displayName,
            status: KnowledgeBaseFileStatus.PENDING,
            error: null,
            chunkCount: 0,
        }
        await kbFileRepo().save(kbFile)
        return { id: kbFile.id }
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
    fileId: string
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
