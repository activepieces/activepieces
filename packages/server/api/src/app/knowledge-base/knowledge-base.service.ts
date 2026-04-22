import { ActivepiecesError, apId, ErrorCode, isNil, KnowledgeBaseFile, spreadIfDefined } from '@activepieces/shared'
import { parse as parseCsv } from 'csv-parse/sync'
import { FastifyBaseLogger } from 'fastify'
import { IsNull, Not } from 'typeorm'
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
    async ingestFile(params: IngestFileParams): Promise<void> {
        const { projectId, knowledgeBaseFileId, embedFn } = params

        const textChunks = await this.extractChunks({ projectId, knowledgeBaseFileId })
        if (textChunks.length === 0) {
            return
        }

        const EMBED_BATCH_SIZE = 50
        const allChunks: StoreChunksParams['chunks'] = []
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

        await this.storeChunks({ projectId, knowledgeBaseFileId, chunks: allChunks })
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
