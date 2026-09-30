import { ActivepiecesAiConsumerSource, ActivepiecesError, apId, ErrorCode, isNil, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { aiUtils } from '@activepieces/server-utils'
import { FileCompression, FileType, KnowledgeBaseFile } from '@activepieces/shared'
import { SharedV3ProviderOptions } from '@ai-sdk/provider'
import { EmbeddingModel, embedMany } from 'ai'
import { parse as parseCsv } from 'csv-parse/sync'
import { FastifyBaseLogger } from 'fastify'
import { In, IsNull, Not } from 'typeorm'
import { aiProviderService } from '../ai/ai-provider-service'
import { repoFactory } from '../core/db/repo-factory'
import { transaction } from '../core/db/transaction'
import { databaseConnection } from '../database/database-connection'
import { distributedLock } from '../database/redis-connections'
import { fileService } from '../file/file.service'
import { KnowledgeBaseChunkEntity } from './knowledge-base-chunk.entity'
import { KnowledgeBaseFileEntity } from './knowledge-base-file.entity'

const kbFileRepo = repoFactory(KnowledgeBaseFileEntity)
const kbChunkRepo = repoFactory(KnowledgeBaseChunkEntity)

const INSERT_BATCH_SIZE = 100
const CHUNK_SIZE_CHARS = 2000
const CHUNK_OVERLAP_CHARS = 200
const EMBED_BATCH_SIZE = 50
const KNOWLEDGE_BASE_BILLING_CONVERSATION = 'knowledge-base'

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

async function chunksOf({ data, fileName }: { data: Buffer, fileName: string }): Promise<string[]> {
    if (fileName.toLowerCase().endsWith('.csv')) {
        return chunkCsvText(data.toString('utf-8'))
    }
    return chunkText(await extractTextFromFile(data, fileName))
}

async function embedAll({ texts, embedFn }: { texts: string[], embedFn: EmbedFn }): Promise<number[][]> {
    const embeddings: number[][] = []
    for (let start = 0; start < texts.length; start += EMBED_BATCH_SIZE) {
        const batch = texts.slice(start, start + EMBED_BATCH_SIZE)
        const batchEmbeddings = await embedFn(batch)
        if (batchEmbeddings.length !== batch.length) {
            throw new Error(`Embedding count mismatch: expected ${batch.length}, got ${batchEmbeddings.length}`)
        }
        embeddings.push(...batchEmbeddings)
    }
    return embeddings
}

function toVector(embedding: number[]): string {
    return `[${embedding.join(',')}]`
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
    async uploadFile(params: UploadFileParams): Promise<KnowledgeBaseFile> {
        const { projectId, data, fileName, displayName, embedFn } = params
        const texts = (await chunksOf({ data, fileName })).filter((text) => text.trim().length > 0)
        if (texts.length === 0) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: KNOWLEDGE_BASE_FILE_HAS_NO_TEXT },
            })
        }
        const embeddings = await embedAll({ texts, embedFn })
        const savedFile = await fileService(log).save({
            projectId,
            data,
            size: data.length,
            type: FileType.KNOWLEDGE_BASE,
            compression: FileCompression.NONE,
            fileName,
        })
        const { data: kbFile, error } = await tryCatch(() => transaction(async (entityManager) => {
            const file = await entityManager.getRepository(KnowledgeBaseFileEntity).save({ id: apId(), projectId, fileId: savedFile.id, displayName })
            const rows = texts.map((content, chunkIndex) => ({
                id: apId(),
                projectId,
                knowledgeBaseFileId: file.id,
                chunkIndex,
                content,
                embedding: toVector(embeddings[chunkIndex]),
                metadata: { chunkIndex, totalChunks: texts.length },
            }))
            for (let start = 0; start < rows.length; start += INSERT_BATCH_SIZE) {
                await entityManager.getRepository(KnowledgeBaseChunkEntity).insert(rows.slice(start, start + INSERT_BATCH_SIZE))
            }
            return file
        }))
        if (error) {
            await fileService(log).delete({ projectId, fileId: savedFile.id })
            throw error
        }
        return kbFile
    },

    async embedderFor(params: { projectId: string, platformId: string, conversationId?: string }): Promise<EmbedFn> {
        const { projectId, platformId, conversationId } = params
        const provider = await aiProviderService(log).getChatProvider({ platformId, scope: { type: 'project', projectId } })
        if (isNil(provider)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: KNOWLEDGE_BASE_NEEDS_AI_PROVIDER },
            })
        }
        const { model, providerOptions } = aiUtils.createEmbeddingModel({
            credentials: provider,
            platformId,
            providerConfigId: provider.configId,
            billing: { source: ActivepiecesAiConsumerSource.CHAT, platformId, projectId, conversationId: conversationId ?? KNOWLEDGE_BASE_BILLING_CONVERSATION },
        })
        return this.embedFnOf({ model, providerOptions })
    },

    embedFnOf(params: { model: EmbeddingModel, providerOptions: SharedV3ProviderOptions }): EmbedFn {
        const { model, providerOptions } = params
        return async (texts) => {
            const { embeddings } = await embedMany({ model, values: texts, providerOptions })
            return embeddings.map((embedding) => aiUtils.toStorageEmbedding(embedding))
        }
    },

    async embedMissingChunks(params: EmbedMissingChunksParams): Promise<number> {
        const { projectId, knowledgeBaseFileId, resolveEmbedFn } = params
        const hasMissing = await kbChunkRepo().existsBy({ projectId, knowledgeBaseFileId, embedding: IsNull() })
        if (!hasMissing) {
            return 0
        }
        return distributedLock(log).runExclusive({
            key: `knowledge_base_embed_${knowledgeBaseFileId}`,
            timeoutInSeconds: 60,
            fn: async () => {
                const missing = await kbChunkRepo().find({
                    where: { projectId, knowledgeBaseFileId, embedding: IsNull() },
                    select: ['id', 'content'],
                    order: { chunkIndex: 'ASC' },
                })
                if (missing.length === 0) {
                    return 0
                }
                const embeddings = await embedAll({ texts: missing.map((chunk) => chunk.content), embedFn: await resolveEmbedFn() })
                await transaction(async (entityManager) => {
                    for (let start = 0; start < missing.length; start += INSERT_BATCH_SIZE) {
                        const batch = missing.slice(start, start + INSERT_BATCH_SIZE)
                        await entityManager.query(
                            `UPDATE knowledge_base_chunk AS kbc
                             SET embedding = missing.embedding::vector
                             FROM unnest($1::varchar[], $2::text[], $3::text[]) AS missing(id, content, embedding)
                             WHERE kbc.id = missing.id AND kbc.content = missing.content AND kbc.embedding IS NULL
                               AND kbc."projectId" = $4 AND kbc."knowledgeBaseFileId" = $5`,
                            [batch.map((chunk) => chunk.id), batch.map((chunk) => chunk.content), embeddings.slice(start, start + INSERT_BATCH_SIZE).map(toVector), projectId, knowledgeBaseFileId],
                        )
                    }
                })
                return missing.length
            },
        })
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

    async isSearchable(params: { projectId: string, knowledgeBaseFileId: string }): Promise<boolean> {
        const { projectId, knowledgeBaseFileId } = params
        const [hasChunks, hasUnindexedChunks] = await Promise.all([
            kbChunkRepo().existsBy({ projectId, knowledgeBaseFileId }),
            kbChunkRepo().existsBy({ projectId, knowledgeBaseFileId, embedding: IsNull() }),
        ])
        return hasChunks && !hasUnindexedChunks
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

        return chunksOf({ data: fileData.data, fileName: fileData.fileName || kbFile.displayName })
    },

    async storeChunks(params: StoreChunksParams): Promise<void> {
        const { projectId, knowledgeBaseFileId, chunks } = params
        const isFullRestore = chunks.every((chunk) => isNil(chunk.id))

        await transaction(async (entityManager) => {
            const owner = await entityManager.getRepository(KnowledgeBaseFileEntity)
                .createQueryBuilder('file')
                .setLock('pessimistic_write')
                .where('file.id = :knowledgeBaseFileId AND file."projectId" = :projectId', { knowledgeBaseFileId, projectId })
                .getOne()
            if (isNil(owner)) {
                throw new ActivepiecesError({
                    code: ErrorCode.ENTITY_NOT_FOUND,
                    params: { entityType: 'KnowledgeBaseFile', entityId: knowledgeBaseFileId },
                })
            }
            const repo = entityManager.getRepository(KnowledgeBaseChunkEntity)
            const stored = await repo.find({ where: { projectId, knowledgeBaseFileId }, select: ['id', 'chunkIndex'] })
            const storedById = new Map(stored.map((row) => [row.id, row]))
            const idByIndex = new Map(stored.map((row) => [row.chunkIndex, row.id]))

            const writeByIndex = new Map<number, { id?: string, values: Record<string, unknown> }>()
            const submittedIds = new Set<string>()
            for (const [position, chunk] of chunks.entries()) {
                const values = {
                    ...spreadIfDefined('content', chunk.content),
                    ...spreadIfDefined('embedding', chunk.embedding ? `[${chunk.embedding.join(',')}]` : undefined),
                    ...spreadIfDefined('metadata', chunk.metadata),
                }
                if (isNil(chunk.id)) {
                    writeByIndex.set(chunk.chunkIndex ?? position, { values: { content: '', metadata: {}, ...values } })
                    continue
                }
                if (submittedIds.has(chunk.id)) {
                    throw new ActivepiecesError({
                        code: ErrorCode.VALIDATION,
                        params: { message: `Chunk ${chunk.id} is listed more than once in the same request` },
                    })
                }
                submittedIds.add(chunk.id)
                const edited = storedById.get(chunk.id)
                if (isNil(edited)) {
                    throw new ActivepiecesError({
                        code: ErrorCode.ENTITY_NOT_FOUND,
                        params: { entityType: 'KnowledgeBaseChunk', entityId: chunk.id },
                    })
                }
                writeByIndex.set(chunk.chunkIndex ?? edited.chunkIndex, { id: chunk.id, values })
            }

            const claimedIds = new Set([...writeByIndex.values()].map((write) => write.id).filter((id) => !isNil(id)))
            const adoptableIdByIndex = new Map([...idByIndex].filter(([, id]) => !claimedIds.has(id)))
            const writes = [...writeByIndex].map(([chunkIndex, write]) => ({
                chunkIndex,
                id: write.id ?? adoptableIdByIndex.get(chunkIndex),
                values: write.values,
            }))
            const keptIds = new Set(writes.map((write) => write.id).filter((id) => !isNil(id)))
            const displacedIds = stored
                .filter((row) => !keptIds.has(row.id) && writeByIndex.has(row.chunkIndex))
                .map((row) => row.id)
            for (let start = 0; start < displacedIds.length; start += INSERT_BATCH_SIZE) {
                await repo.delete({ id: In(displacedIds.slice(start, start + INSERT_BATCH_SIZE)), projectId, knowledgeBaseFileId })
            }

            const inserts = writes
                .filter((write) => isNil(write.id))
                .map((write) => ({ id: apId(), projectId, knowledgeBaseFileId, chunkIndex: write.chunkIndex, ...write.values }))
            for (const write of writes) {
                if (isNil(write.id)) {
                    continue
                }
                await repo.update({ id: write.id, projectId, knowledgeBaseFileId }, { ...write.values, chunkIndex: write.chunkIndex })
            }
            for (let start = 0; start < inserts.length; start += INSERT_BATCH_SIZE) {
                await repo.insert(inserts.slice(start, start + INSERT_BATCH_SIZE))
            }

            if (!isFullRestore) {
                return
            }
            const submittedIndexes = [...writeByIndex.keys()]
            const cleanup = repo.createQueryBuilder()
                .delete()
                .where('"projectId" = :projectId AND "knowledgeBaseFileId" = :knowledgeBaseFileId', { projectId, knowledgeBaseFileId })
            if (submittedIndexes.length > 0) {
                cleanup.andWhere('"chunkIndex" NOT IN (:...submittedIndexes)', { submittedIndexes })
            }
            await cleanup.execute()
        })
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

export const KNOWLEDGE_BASE_NEEDS_AI_PROVIDER = 'KNOWLEDGE_BASE_NEEDS_AI_PROVIDER'
export const KNOWLEDGE_BASE_FILE_HAS_NO_TEXT = 'KNOWLEDGE_BASE_FILE_HAS_NO_TEXT'

type UploadFileParams = {
    projectId: string
    data: Buffer
    fileName: string
    displayName: string
    embedFn: EmbedFn
}

type EmbedFn = (texts: string[]) => Promise<number[][]>

type EmbedMissingChunksParams = {
    projectId: string
    knowledgeBaseFileId: string
    resolveEmbedFn: () => Promise<EmbedFn>
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
