import { apVersionUtil } from '@activepieces/server-utils'
import { apId, chunk, isNil, tryCatch } from '@activepieces/shared'
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
     * Reconcile `tool_search_index` against the live catalog — an idempotent, hash-gated incremental
     * diff (Phase 3). Re-derive the desired state from `piece_metadata` (latest version per piece,
     * exploded into one row per action/trigger), then: upsert by unique key (new rows land with
     * embedding=NULL; a row's embedding survives a pure version bump but is nulled when its retrieval
     * text changes), delete rows whose key left the catalog, and embed only the rows still missing an
     * embedding. A re-run with an unchanged catalog is a no-op (0 embedded, 0 deleted).
     *
     * `scope` bounds the reconcile: `all` (default — the global sync hook) reconciles the whole index;
     * `platform` reconciles only one tenant's custom pieces (the custom-piece install hook) and never
     * touches the shared base catalog. A `model_version` change rebuilds under the new version while
     * old-version rows keep serving reads until cutover.
     *
     * The embedder is injectable so tests can drive a deterministic fake with no key/network. In
     * production `platformId` names the platform whose OpenAI key funds the embedding; when neither
     * an embedder nor a resolvable key is available the reindex is a no-op (keyword floor serves).
     */
    async reindex(params: ReindexParams): Promise<ReindexResult> {
        const scope: ReindexScope = params.scope ?? { type: 'all' }
        const embedder = params.embedder ?? (isNil(params.platformId)
            ? null
            : await resolveEmbedder({ platformId: params.platformId, log }))
        if (isNil(embedder)) {
            log.info('[toolSearchReindexService#reindex] No embedder resolved — skipping reindex (keyword floor serves).')
            return { status: 'no-embedder', objectsIndexed: 0, objectsEmbedded: 0, objectsDeleted: 0 }
        }
        // The migration no-ops when pgvector is absent, so the table can be missing even with the flag
        // on. Degrade gracefully (keyword floor) instead of throwing "relation does not exist" on every
        // catalog-change reconcile.
        if (!await toolSearchTableExists()) {
            log.warn('[toolSearchReindexService#reindex] tool_search_index is absent (pgvector not installed) — skipping reindex; keyword floor serves.')
            return { status: 'no-table', objectsIndexed: 0, objectsEmbedded: 0, objectsDeleted: 0 }
        }

        const currentRelease = apVersionUtil.getCurrentRelease()
        const pieces = await fetchLatestCompatiblePiecesFromDB(currentRelease)
        const desired = pieces
            .flatMap((piece) => explodePiece(piece, embedder.modelVersion))
            .filter((record) => scopeMatches(record, scope))

        // Upsert the desired rows by unique key. A new row lands with embedding=NULL; an existing row
        // keeps its embedding unless the retrieval text (→ hash) changed, in which case it is nulled to
        // force a re-embed. Rows whose content is unchanged are not touched at all (idempotent).
        for (const record of desired) {
            await upsertRow(record, embedder.modelVersion)
        }

        // Remove rows whose object key is no longer in the desired catalog (deleted pieces, removed
        // actions, superseded old versions). Done before embedding so a row that is both pending and
        // gone is never wastefully embedded.
        const objectsDeleted = await deleteRemovedRows(desired, embedder.modelVersion, scope)

        // Embed only the rows still missing an embedding (the new + changed ones, plus any that failed
        // a previous run). Embedding is batched and never blocks the upsert diff above.
        const objectsEmbedded = await embedPendingRows(embedder, scope, log)

        log.info({ scope: scope.type, objectsIndexed: desired.length, objectsEmbedded, objectsDeleted }, '[toolSearchReindexService#reindex] Reindex complete.')
        return { status: 'done', objectsIndexed: desired.length, objectsEmbedded, objectsDeleted }
    },
})

/** A platform-scoped reconcile only owns that tenant's custom pieces; `all` owns the whole index. */
function scopeMatches(record: DesiredRecord, scope: ReindexScope): boolean {
    return scope.type === 'all' || record.platformId === scope.platformId
}

/**
 * Delete every row at the current model_version whose (pieceName, objectKind, objectName) key is not
 * in the desired set — i.e. deleted pieces, removed actions/triggers, and versions superseded by a
 * newer one. Rows at OTHER model_versions are left untouched (a model swap keeps them serving reads
 * until cutover). The desired keys are passed as parallel arrays so the statement is parameter-bounded
 * regardless of catalog size. Returns the number of rows deleted.
 */
async function deleteRemovedRows(desired: DesiredRecord[], modelVersion: string, scope: ReindexScope): Promise<number> {
    const params: unknown[] = [
        modelVersion,
        desired.map((record) => record.pieceName),
        desired.map((record) => record.objectKind),
        desired.map((record) => record.objectName),
    ]
    // A platform-scoped reconcile must only ever delete that tenant's rows — without this clause a
    // scoped run would wipe the shared catalog (none of its keys are in the scoped desired set).
    const scopeClause = scope.type === 'platform' ? ` AND "platformId" = $${params.push(scope.platformId)}` : ''
    // RETURNING "id" so PGlite reports the deleted rows as a rows array; node-postgres reports
    // `[rows, affectedCount]`. rawWriteRowCount normalizes both — do NOT read `.length` directly
    // (it is always 2 on node-postgres, which silently over-counts deletes on real Postgres).
    const deleted = await databaseConnection().query(
        `DELETE FROM "tool_search_index"
         WHERE "modelVersion" = $1${scopeClause}
           AND ("pieceName", "objectKind", "objectName") NOT IN (
               SELECT * FROM unnest($2::text[], $3::text[], $4::text[])
           )
         RETURNING "id"`,
        params,
    )
    return rawWriteRowCount(deleted)
}

/**
 * Count rows written by a raw `DELETE`/`UPDATE … RETURNING` query, normalizing TypeORM's non-uniform
 * `query()` return: the node-postgres driver returns `[returnedRows, affectedCount]`, whereas PGlite
 * returns the RETURNING rows array directly (as do all SELECTs). Reading `.length` on the node-postgres
 * tuple always yields 2 — the bug that over-counted incremental-reconcile deletes on real Postgres while
 * passing on PGlite. Detect the `[rows, count]` shape (2-element array whose first element is itself the
 * rows array and second is the numeric count) and read the count; otherwise the result IS the rows array.
 */
export function rawWriteRowCount(result: unknown): number {
    if (Array.isArray(result) && result.length === 2 && Array.isArray(result[0]) && typeof result[1] === 'number') {
        return result[1]
    }
    return Array.isArray(result) ? result.length : 0
}

/**
 * Whether the tool_search_index table exists. The migration no-ops when the pgvector extension is
 * absent, so on such a deployment the table is never created — reindex and the cold-start backfill
 * must degrade gracefully (keyword floor) rather than throw "relation does not exist".
 */
export async function toolSearchTableExists(): Promise<boolean> {
    const result = await databaseConnection().query(`SELECT to_regclass('tool_search_index') AS reg`)
    return !isNil(result?.[0]?.reg)
}

/**
 * Embed every row that still lacks an embedding at the current model_version (new rows, rows whose
 * text changed and were nulled by the upsert, and rows that failed a prior reindex). Batched; the
 * embedder owns retry/backoff. Returns the number of objects embedded.
 */
async function embedPendingRows(embedder: ToolSearchEmbedder, scope: ReindexScope, log: FastifyBaseLogger): Promise<number> {
    const params: unknown[] = [embedder.modelVersion]
    const scopeClause = scope.type === 'platform' ? ` AND "platformId" = $${params.push(scope.platformId)}` : ''
    const pending: PendingRow[] = await databaseConnection().query(
        `SELECT "id", "retrievalDoc" FROM "tool_search_index"
         WHERE "embedding" IS NULL AND "modelVersion" = $1${scopeClause}`,
        params,
    )
    let embedded = 0
    for (const batch of chunk(pending, EMBED_BATCH_SIZE)) {
        // A batch that fails after the embedder's own retries leaves its rows NULL and is skipped, not
        // fatal — the next reindex re-selects them (still NULL) and retries. One bad batch never aborts
        // the whole reconcile or rolls back the rows that did embed.
        const { data: vectors, error } = await tryCatch(() => embedder.embed(batch.map((row) => row.retrievalDoc)))
        if (isNil(vectors)) {
            log.warn({ error, batchSize: batch.length, modelVersion: embedder.modelVersion }, '[toolSearchReindexService#embed] Embedding batch failed — rows kept NULL, retried next reindex.')
            continue
        }
        if (vectors.length !== batch.length) {
            throw new Error(`Embedding count mismatch: expected ${batch.length}, got ${vectors.length}`)
        }
        for (let i = 0; i < batch.length; i++) {
            await databaseConnection().query(
                'UPDATE "tool_search_index" SET "embedding" = $1::vector, "updated" = now() WHERE "id" = $2',
                [`[${vectors[i].join(',')}]`, batch[i].id],
            )
        }
        embedded += batch.length
    }
    return embedded
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

async function upsertRow(record: DesiredRecord, modelVersion: string): Promise<void> {
    // A new row is inserted WITHOUT an embedding (embedPendingRows fills it); an existing row's
    // embedding survives a pure version bump (hash unchanged) but is nulled the moment its retrieval
    // text changes, forcing a re-embed. The DO UPDATE is skipped entirely when nothing changed so a
    // re-run is a true no-op. Match the partial unique index for this row's tenancy: shared catalog
    // rows (platformId IS NULL) arbitrate on uq_tsi_object_shared, tenant rows on uq_tsi_object_tenant
    // — the ON CONFLICT predicate must equal the index predicate (PG14 has no NULLS NOT DISTINCT).
    const conflictTarget = isNil(record.platformId)
        ? '("pieceName", "objectKind", "objectName", "modelVersion") WHERE "platformId" IS NULL'
        : '("pieceName", "objectKind", "objectName", "platformId", "modelVersion") WHERE "platformId" IS NOT NULL'
    await databaseConnection().query(
        `INSERT INTO "tool_search_index" AS tsi (
            "id", "objectKind", "pieceName", "pieceVersion", "objectName", "displayName",
            "retrievalDoc", "audience", "requiresConnection", "categories", "modelVersion",
            "embeddingInputHash", "platformId"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::varchar[], $11, $12, $13)
        ON CONFLICT ${conflictTarget}
        DO UPDATE SET
            "pieceVersion" = EXCLUDED."pieceVersion",
            "displayName" = EXCLUDED."displayName",
            "retrievalDoc" = EXCLUDED."retrievalDoc",
            "audience" = EXCLUDED."audience",
            "requiresConnection" = EXCLUDED."requiresConnection",
            "categories" = EXCLUDED."categories",
            "embeddingInputHash" = EXCLUDED."embeddingInputHash",
            "embedding" = CASE WHEN tsi."embeddingInputHash" IS DISTINCT FROM EXCLUDED."embeddingInputHash"
                THEN NULL ELSE tsi."embedding" END,
            "updated" = now()
        WHERE tsi."pieceVersion" IS DISTINCT FROM EXCLUDED."pieceVersion"
           OR tsi."displayName" IS DISTINCT FROM EXCLUDED."displayName"
           OR tsi."retrievalDoc" IS DISTINCT FROM EXCLUDED."retrievalDoc"
           OR tsi."audience" IS DISTINCT FROM EXCLUDED."audience"
           OR tsi."requiresConnection" IS DISTINCT FROM EXCLUDED."requiresConnection"
           OR tsi."categories" IS DISTINCT FROM EXCLUDED."categories"
           OR tsi."embeddingInputHash" IS DISTINCT FROM EXCLUDED."embeddingInputHash"`,
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
            record.platformId,
        ],
    )
}

/** Bounds the reconcile: the whole index, or only one tenant's custom pieces. */
export type ReindexScope =
    | { type: 'all' }
    | { type: 'platform', platformId: string }

type ReindexParams = {
    /** Defaults to `{ type: 'all' }`. A `platform` scope never touches the shared base catalog. */
    scope?: ReindexScope
    /** Platform whose configured OpenAI key funds embedding when `embedder` is not injected. */
    platformId?: string
    embedder?: ToolSearchEmbedder | null
}

type ReindexResult = {
    status: 'done' | 'no-embedder' | 'no-table'
    /** desired-state object count (latest version per piece, exploded into actions + triggers). */
    objectsIndexed: number
    /** rows that were (re)embedded this run — 0 when nothing changed. */
    objectsEmbedded: number
    /** rows removed because their key is no longer in the desired catalog. */
    objectsDeleted: number
}

type PendingRow = {
    id: string
    retrievalDoc: string
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
