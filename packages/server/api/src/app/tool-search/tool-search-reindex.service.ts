import { apVersionUtil } from '@activepieces/server-utils'
import { apId, chunk, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { databaseConnection } from '../database/database-connection'
import { PieceMetadataSchema } from '../pieces/metadata/piece-metadata-entity'
import { fetchLatestCompatiblePiecesFromDB } from '../pieces/metadata/piece-metadata-service'
import { ToolSearchEmbedder } from './embedder'
import { resolveEmbedder } from './resolve-embedder'
import { buildRetrievalDoc, computeEmbeddingInputHash } from './retrieval-doc'

const EMBED_BATCH_SIZE = 256

export const toolSearchReindexService = (log: FastifyBaseLogger) => ({
    /**
     * Phase 1: a manually-invokable FULL rebuild of `tool_search_index` from the live catalog.
     * Enumerate the latest version of every piece, explode its actions+triggers JSON into one row
     * each, embed the retrieval docs, and upsert by the object's unique key. The hash-gated
     * incremental diff + delete-of-removed and the async job/event hook are deferred to Phase 3;
     * here every desired object is (re)embedded and written.
     *
     * The embedder is injectable so tests can drive a deterministic fake with no key/network. In
     * production `platformId` names the platform whose OpenAI key funds the embedding; when neither
     * an embedder nor a resolvable key is available the reindex is a no-op (keyword floor serves).
     */
    async reindex(params: ReindexParams): Promise<ReindexResult> {
        const embedder = params.embedder ?? (isNil(params.platformId)
            ? null
            : await resolveEmbedder({ platformId: params.platformId, log }))
        if (isNil(embedder)) {
            log.info('[toolSearchReindexService#reindex] No embedder resolved — skipping reindex (keyword floor serves).')
            return { status: 'no-embedder', objectsIndexed: 0 }
        }

        const currentRelease = apVersionUtil.getCurrentRelease()
        const pieces = await fetchLatestCompatiblePiecesFromDB(currentRelease)
        const records = pieces.flatMap((piece) => explodePiece(piece, embedder.modelVersion))
        if (records.length === 0) {
            return { status: 'done', objectsIndexed: 0 }
        }

        const embeddings = await embedInBatches(embedder, records.map((record) => record.retrievalDoc))
        for (let i = 0; i < records.length; i++) {
            await upsertRow(records[i], embeddings[i], embedder.modelVersion)
        }

        log.info({ objectsIndexed: records.length }, '[toolSearchReindexService#reindex] Reindex complete.')
        return { status: 'done', objectsIndexed: records.length }
    },
})

async function embedInBatches(embedder: ToolSearchEmbedder, docs: string[]): Promise<number[][]> {
    const embeddings: number[][] = []
    for (const batch of chunk(docs, EMBED_BATCH_SIZE)) {
        const batchEmbeddings = await embedder.embed(batch)
        if (batchEmbeddings.length !== batch.length) {
            throw new Error(`Embedding count mismatch: expected ${batch.length}, got ${batchEmbeddings.length}`)
        }
        embeddings.push(...batchEmbeddings)
    }
    return embeddings
}

function explodePiece(piece: PieceMetadataSchema, modelVersion: string): DesiredRecord[] {
    const actionRecords = Object.entries(piece.actions).map(([objectName, action]) => buildRecord({
        piece,
        modelVersion,
        objectKind: 'action',
        objectName,
        displayName: action.displayName,
        description: action.description,
        aiDescription: action.aiMetadata?.description,
        requiresConnection: action.requireAuth,
        audience: action.audience ?? null,
    }))
    const triggerRecords = Object.entries(piece.triggers).map(([objectName, trigger]) => buildRecord({
        piece,
        modelVersion,
        objectKind: 'trigger',
        objectName,
        displayName: trigger.displayName,
        description: trigger.description,
        aiDescription: trigger.aiMetadata?.description,
        requiresConnection: trigger.requireAuth,
        audience: null,
    }))
    return [...actionRecords, ...triggerRecords]
}

function buildRecord(params: BuildRecordParams): DesiredRecord {
    const retrievalDoc = buildRetrievalDoc({
        pieceDisplayName: params.piece.displayName,
        objectDisplayName: params.displayName,
        objectKind: params.objectKind,
        description: params.description,
        aiDescription: params.aiDescription,
    })
    return {
        objectKind: params.objectKind,
        pieceName: params.piece.name,
        pieceVersion: params.piece.version,
        objectName: params.objectName,
        displayName: params.displayName,
        retrievalDoc,
        audience: params.audience,
        requiresConnection: params.requiresConnection,
        categories: params.piece.categories ?? null,
        embeddingInputHash: computeEmbeddingInputHash(retrievalDoc, params.modelVersion),
        platformId: params.piece.platformId ?? null,
    }
}

async function upsertRow(record: DesiredRecord, embedding: number[], modelVersion: string): Promise<void> {
    await databaseConnection().query(
        `INSERT INTO "tool_search_index" (
            "id", "objectKind", "pieceName", "pieceVersion", "objectName", "displayName",
            "retrievalDoc", "audience", "requiresConnection", "categories", "modelVersion",
            "embeddingInputHash", "embedding", "platformId"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::varchar[], $11, $12, $13::vector, $14)
        ON CONFLICT ("pieceName", "objectKind", "objectName", "platformId", "modelVersion")
        DO UPDATE SET
            "pieceVersion" = EXCLUDED."pieceVersion",
            "displayName" = EXCLUDED."displayName",
            "retrievalDoc" = EXCLUDED."retrievalDoc",
            "audience" = EXCLUDED."audience",
            "requiresConnection" = EXCLUDED."requiresConnection",
            "categories" = EXCLUDED."categories",
            "embeddingInputHash" = EXCLUDED."embeddingInputHash",
            "embedding" = EXCLUDED."embedding",
            "updated" = now()`,
        [
            apId(),
            record.objectKind,
            record.pieceName,
            record.pieceVersion,
            record.objectName,
            record.displayName,
            record.retrievalDoc,
            record.audience,
            record.requiresConnection,
            record.categories,
            modelVersion,
            record.embeddingInputHash,
            `[${embedding.join(',')}]`,
            record.platformId,
        ],
    )
}

type ReindexParams = {
    platformId?: string
    embedder?: ToolSearchEmbedder | null
}

type ReindexResult = {
    status: 'done' | 'no-embedder'
    objectsIndexed: number
}

type DesiredRecord = {
    objectKind: 'action' | 'trigger'
    pieceName: string
    pieceVersion: string
    objectName: string
    displayName: string
    retrievalDoc: string
    audience: string | null
    requiresConnection: boolean
    categories: string[] | null
    embeddingInputHash: string
    platformId: string | null
}

type BuildRecordParams = {
    piece: PieceMetadataSchema
    modelVersion: string
    objectKind: 'action' | 'trigger'
    objectName: string
    displayName: string
    description: string
    aiDescription: string | undefined
    requiresConnection: boolean
    audience: string | null
}
