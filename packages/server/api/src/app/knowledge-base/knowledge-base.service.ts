import { ActivepiecesError, apId, ErrorCode, isNil, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { KnowledgeBaseFile } from '@activepieces/shared'
import { parse as parseCsv } from 'csv-parse/sync'
import { FastifyBaseLogger } from 'fastify'
import { IsNull, Not } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { databaseConnection } from '../database/database-connection'
import { distributedLock } from '../database/redis-connections'
import { fileService } from '../file/file.service'
import { KnowledgeBaseChunkEntity } from './knowledge-base-chunk.entity'
import { KnowledgeBaseFileEntity } from './knowledge-base-file.entity'

const kbFileRepo = repoFactory(KnowledgeBaseFileEntity)
const kbChunkRepo = repoFactory(KnowledgeBaseChunkEntity)

const CHUNK_SIZE_CHARS = 2000
const CHUNK_OVERLAP_CHARS = 200
const EMBED_BATCH_SIZE = 50
const EMBED_LOCK_TIMEOUT_SECONDS = 20
const EMBED_TIME_BUDGET_MS = 20_000

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

function chunkCsvText(csvText: string): string[] {
    const records: string[][] = parseCsv(csvText, { relax_column_count: true })
    if (records.length === 0) return []

    const headerLine = records[0].join(',')
    const chunks: string[] = []
    let currentRows: string[] = []
    let currentLength = headerLine.length + 1

    for (let i = 1; i < records.length; i++) {
        const rowLine = records[i].join(',')
        if (currentLength + rowLine.length + 1 > CHUNK_SIZE_CHARS && currentRows.length > 0) {
            chunks.push(headerLine + '\n' + currentRows.join('\n'))
            currentRows = []
            currentLength = headerLine.length + 1
        }
        currentRows.push(rowLine)
        currentLength += rowLine.length + 1
    }
    if (currentRows.length > 0) {
        chunks.push(headerLine + '\n' + currentRows.join('\n'))
    }
    return chunks
}

async function extractTextFromFile(fileBuffer: Buffer, fileName: string): Promise<string> {
    const lowerName = (fileName ?? '').toLowerCase()
    if (lowerName.endsWith('.pdf')) {
        const { extractText, getDocumentProxy } = await import('unpdf')
        const pdf = await getDocumentProxy(new Uint8Array(fileBuffer))
        const { text } = await extractText(pdf, { mergePages: true })
        return text
    }

    if (lowerName.endsWith('.docx')) {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer: fileBuffer })
        return result.value
    }

    return fileBuffer.toString('utf-8')
}

export const knowledgeBaseService = (log: FastifyBaseLogger) => ({
    /**
     * Called on the search path, which the worker reaches over an RPC that gives up after 60s, so
     * everything here is bounded: waiting for the lock and embedding share one budget, and whatever
     * is not finished is left for the next search rather than held onto until the RPC dies.
     */
    async embedPendingChunks(params: EmbedPendingChunksParams): Promise<EmbedPendingChunksResult> {
        const { projectId, knowledgeBaseFileId, embedFn } = params
        const enteredAt = Date.now()

        const { data: outcome, error: lockError } = await tryCatch(() => distributedLock(log).runExclusive({
            key: `kb-embed-${knowledgeBaseFileId}`,
            timeoutInSeconds: EMBED_LOCK_TIMEOUT_SECONDS,
            fn: async (): Promise<EmbedPendingChunksOutcome> => {
                // The lock wait counts against the budget, so a caller that queued behind another
                // embedder cannot start a fresh slice late enough to outlive the worker's RPC.
                const startedAt = Date.now()
                const pending = (await this.listChunks({ projectId, knowledgeBaseFileId, embedded: false }))
                    .filter((pendingChunk) => pendingChunk.content.trim().length > 0)
                if (pending.length === 0) {
                    return { result: { embeddedCount: 0, remainingCount: 0 } }
                }

                let embeddedCount = 0
                for (let i = 0; i < pending.length; i += EMBED_BATCH_SIZE) {
                    const remainingMs = EMBED_TIME_BUDGET_MS - (Date.now() - enteredAt)
                    if (remainingMs <= 0) {
                        break
                    }
                    const batch = pending.slice(i, i + EMBED_BATCH_SIZE)
                    // The signal is what actually enforces the budget: without it one slow provider
                    // call started just inside the deadline could still outlive the worker's RPC.
                    const abortSignal = AbortSignal.timeout(remainingMs)
                    const { data: embeddings, error } = await tryCatch(() => embedFn(batch.map((pendingChunk) => pendingChunk.content), { abortSignal }))
                    if (isNil(embeddings)) {
                        if (!abortSignal.aborted) {
                            return { embedError: error ?? new Error('Embedding failed') }
                        }
                        log.warn({ project: { id: projectId }, knowledgeBaseFile: { id: knowledgeBaseFileId }, embeddedCount }, '[knowledgeBaseService#embedPendingChunks] Ran out of embedding budget mid-batch, leaving the rest to the next search')
                        break
                    }
                    if (embeddings.length !== batch.length) {
                        return { embedError: new Error(`Embedding count mismatch: expected ${batch.length}, got ${embeddings.length}`) }
                    }
                    await this.setChunkEmbeddings({
                        projectId,
                        chunks: batch.map((pendingChunk, index) => ({ id: pendingChunk.id, embedding: embeddings[index] })),
                    })
                    embeddedCount += batch.length
                }

                const remainingCount = pending.length - embeddedCount
                log.info({ project: { id: projectId }, knowledgeBaseFile: { id: knowledgeBaseFileId }, embeddedCount, remainingCount, durationMs: Date.now() - startedAt }, '[knowledgeBaseService#embedPendingChunks] Embedded chunks that were stored without a vector')
                return { result: { embeddedCount, remainingCount } }
            },
        }))

        // Losing the race is not a failure: another call is embedding this file, so search what is
        // already indexed rather than failing the tool or waiting past the RPC deadline.
        if (isNil(outcome)) {
            log.warn({ project: { id: projectId }, knowledgeBaseFile: { id: knowledgeBaseFileId }, error: lockError, waitedMs: Date.now() - enteredAt }, '[knowledgeBaseService#embedPendingChunks] Could not take the embedding lock, searching what is already indexed')
            return { embeddedCount: 0, remainingCount: await this.countPendingChunks({ projectId, knowledgeBaseFileId }) }
        }
        if (isNil(outcome.result)) {
            throw outcome.embedError
        }
        return outcome.result
    },

    async countPendingChunks(params: { projectId: string, knowledgeBaseFileId: string }): Promise<number> {
        return kbChunkRepo().count({
            where: { projectId: params.projectId, knowledgeBaseFileId: params.knowledgeBaseFileId, embedding: IsNull() },
        })
    },

    async setChunkEmbeddings(params: SetChunkEmbeddingsParams): Promise<void> {
        const { projectId, chunks } = params
        if (chunks.length === 0) return

        await databaseConnection().query(
            `UPDATE knowledge_base_chunk AS kbc
                SET embedding = incoming.embedding::vector
               FROM unnest($1::text[], $2::text[]) AS incoming(id, embedding)
              WHERE kbc.id = incoming.id
                AND kbc."projectId" = $3`,
            [
                chunks.map((chunk) => chunk.id),
                chunks.map((chunk) => `[${chunk.embedding.join(',')}]`),
                projectId,
            ],
        )
    },

    async search(params: SearchParams): Promise<SearchResult[]> {
        const { projectId, knowledgeBaseFileIds, queryEmbedding, limit, similarityThreshold } = params
        const embeddingStr = `[${queryEmbedding.join(',')}]`

        const results = await databaseConnection().query(
            `SELECT kbc.id, kbc.content, kbc.metadata, kbc."chunkIndex",
                    kbc.embedding <=> $1::vector AS distance
             FROM knowledge_base_chunk kbc
             WHERE kbc."projectId" = $2
               AND kbc."knowledgeBaseFileId" = ANY($3)
               AND kbc.embedding IS NOT NULL
             ORDER BY distance
             LIMIT $4`,
            [embeddingStr, projectId, knowledgeBaseFileIds, limit],
        )

        return results
            .map((row: SearchRow) => ({
                id: row.id,
                content: row.content,
                metadata: row.metadata,
                chunkIndex: row.chunkIndex,
                score: Math.max(0, 1 - row.distance),
            }))
            .filter((row: SearchResult) => similarityThreshold === undefined || row.score >= similarityThreshold)
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
        const kbFile = await kbFileRepo().findOneBy({
            id: params.id,
            projectId: params.projectId,
        })
        if (!kbFile) {
            return
        }
        await kbFileRepo().delete({
            id: params.id,
            projectId: params.projectId,
        })
        await fileService(log).delete({
            projectId: params.projectId,
            fileId: kbFile.fileId,
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

    async getChunkCount(params: { projectId: string, knowledgeBaseFileId: string }): Promise<number> {
        return kbChunkRepo().count({ where: { projectId: params.projectId, knowledgeBaseFileId: params.knowledgeBaseFileId } })
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

        const fileName = fileData.fileName || kbFile.displayName
        if (fileName.toLowerCase().endsWith('.csv')) {
            return chunkCsvText(fileData.data.toString('utf-8'))
        }

        const text = await extractTextFromFile(fileData.data, fileName)
        return chunkText(text)
    },

    async storeChunks(params: StoreChunksParams): Promise<void> {
        const { projectId, knowledgeBaseFileId, chunks } = params
        if (chunks.length === 0) return

        const newChunks = chunks.filter((c) => isNil(c.id))
        const existingChunks = chunks.filter((c) => !isNil(c.id))

        if (newChunks.length > 0) {
            const entities = newChunks.map((chunk) => ({
                id: apId(),
                projectId,
                knowledgeBaseFileId,
                content: chunk.content ?? '',
                chunkIndex: chunk.chunkIndex ?? 0,
                ...spreadIfDefined('embedding', chunk.embedding ? `[${chunk.embedding.join(',')}]` : undefined),
                metadata: chunk.metadata ?? {},
            }))

            const BATCH_SIZE = 100
            for (let i = 0; i < entities.length; i += BATCH_SIZE) {
                await kbChunkRepo().insert(entities.slice(i, i + BATCH_SIZE))
            }
        }

        for (const chunk of existingChunks) {
            await kbChunkRepo().update(
                { id: chunk.id, projectId },
                {
                    ...spreadIfDefined('content', chunk.content),
                    ...spreadIfDefined('embedding', chunk.embedding ? `[${chunk.embedding.join(',')}]` : undefined),
                    ...spreadIfDefined('chunkIndex', chunk.chunkIndex),
                    ...spreadIfDefined('metadata', chunk.metadata),
                },
            )
        }
    },

    async listChunks(params: ListChunksParams): Promise<ChunkListItem[]> {
        return kbChunkRepo().find({
            where: {
                projectId: params.projectId,
                knowledgeBaseFileId: params.knowledgeBaseFileId,
                ...params.embedded === false ? { embedding: IsNull() } : {},
                ...params.embedded === true ? { embedding: Not(IsNull()) } : {},
            },
            select: ['id', 'content', 'chunkIndex'],
            order: { chunkIndex: 'ASC' },
        })
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

type EmbedPendingChunksResult = {
    embeddedCount: number
    remainingCount: number
}

type EmbedPendingChunksOutcome =
    | { result: EmbedPendingChunksResult, embedError?: undefined }
    | { result?: undefined, embedError: Error }

type SetChunkEmbeddingsParams = {
    projectId: string
    chunks: { id: string, embedding: number[] }[]
}

type EmbedPendingChunksParams = {
    projectId: string
    knowledgeBaseFileId: string
    embedFn: (texts: string[], options: { abortSignal: AbortSignal }) => Promise<number[][]>
}

type SearchParams = {
    projectId: string
    knowledgeBaseFileIds: string[]
    queryEmbedding: number[]
    limit: number
    similarityThreshold?: number
}

type SearchRow = {
    id: string
    content: string
    metadata: Record<string, unknown>
    chunkIndex: number
    distance: number
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

type StoreChunksParams = {
    projectId: string
    knowledgeBaseFileId: string
    chunks: {
        id?: string
        content?: string
        embedding?: number[]
        chunkIndex?: number
        metadata?: Record<string, unknown>
    }[]
}

type ListChunksParams = {
    projectId: string
    knowledgeBaseFileId: string
    embedded?: boolean
}

type ChunkListItem = {
    id: string
    content: string
    chunkIndex: number
}
