import { AppConnectionStatus, isNil, PieceAudienceFilter, SuggestionType, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { appConnectionService } from '../app-connection/app-connection-service/app-connection-service'
import { databaseConnection } from '../database/database-connection'
import { pieceMetadataService } from '../pieces/metadata/piece-metadata-service'
import { ToolSearchEmbedder } from './embedder'
import { applyNoMatchGate } from './no-match-gate'
import { resolveEmbedder } from './resolve-embedder'
import { extractRetrievalDocDescription } from './retrieval-doc'

const DEFAULT_LIMIT = 5

// The closed audience domain. `audience` is nullable in the index (an unset audience reads as 'both').
const ALL_AUDIENCES = ['human', 'ai', 'both']

// Over-fetch this many ranked candidates under the SQL filters, then apply the app-layer filters
// (enabled-piece) and the τ gate before slicing to the caller's top-k. Generous headroom so that
// dropping disabled pieces still leaves enough to fill the requested limit. Per the retrieval contract.
const CANDIDATE_POOL = 50

type ObjectKind = 'action' | 'trigger'

export const toolSearchService = (log: FastifyBaseLogger) => ({
    /**
     * Action search with a keyword floor. When an embedder is available, run the full semantic
     * pipeline ({@link searchObjects}: cosine scan + Phase-4 filters + τ gate + connected flag).
     * When no embedder/AI key resolves — or a live embed/query call fails — degrade to the keyword
     * floor (the pre-existing Fuse catalog search behind `ap_research_pieces`), reshaped into the same
     * action-row envelope and flagged `mode:"keyword"`. The tool never hard-fails.
     */
    async searchActions(query: string, opts: ToolSearchParams): Promise<ToolSearchActionResponse> {
        const { results, mode, degradeReason } = await searchObjects('action', query, opts, log)
        return { results: results.map(toActionResult), mode, degradeReason }
    },
    /**
     * Trigger search — the same retrieval engine over `objectKind = 'trigger'` rows (mirrors
     * {@link searchActions}). Triggers carry no `audience`, so the audience filter is a no-op for them;
     * tenant isolation, the optional `pieceName` scope, the enabled-piece filter, the τ gate and the
     * keyword floor all apply identically. τ is the same per-model constant — calibrated over the full
     * mixed-kind corpus, and a trigger-only query searches a strict subset, so junk rejection is at
     * least as strong (E6 note, plan Phase 6).
     */
    async searchTriggers(query: string, opts: ToolSearchParams): Promise<ToolSearchTriggerResponse> {
        const { results, mode, degradeReason } = await searchObjects('trigger', query, opts, log)
        return { results: results.map(toTriggerResult), mode, degradeReason }
    },
})

/**
 * Shared dispatcher for both object kinds: run the semantic pipeline when an embedder is available,
 * otherwise (or on a live embed/query failure) degrade to the keyword floor. Returns generic
 * `objectName`-keyed rows; the public wrappers rename them to `actionName`/`triggerName`.
 */
async function searchObjects(objectKind: ObjectKind, query: string, opts: ToolSearchParams, log: FastifyBaseLogger): Promise<ToolSearchObjectResponse> {
    const embedder = opts.embedder ?? (isNil(opts.platformId)
        ? null
        : await resolveEmbedder({ platformId: opts.platformId, log }))
    if (isNil(embedder)) {
        return keywordSearch({ objectKind, query, opts, log, degradeReason: 'no-embedder' })
    }

    const semantic = await tryCatch(() => semanticSearch({ objectKind, query, opts, embedder, log }))
    if (semantic.error !== null) {
        log.warn({ error: semantic.error, objectKind }, '[toolSearchService#searchObjects] Semantic search failed — degrading to the keyword floor.')
        return keywordSearch({ objectKind, query, opts, log, degradeReason: 'embed-failed' })
    }
    return semantic.data
}

async function semanticSearch({ objectKind, query, opts, embedder, log }: SemanticSearchParams): Promise<ToolSearchObjectResponse> {
    const [queryVector] = await embedder.embed([query])
    const limit = opts.limit ?? DEFAULT_LIMIT

    // Build the candidate query filter-by-filter so each clause is parameter-bound. The query vector is
    // $1 (referenced by the cosine SELECT + ORDER BY); every other value is appended via params.push.
    // Tenant isolation, audience exclusion and the optional pieceName scope are all expressible in SQL.
    const params: unknown[] = [`[${queryVector.join(',')}]`]
    const where = [
        '"embedding" IS NOT NULL',
        `"modelVersion" = $${params.push(embedder.modelVersion)}`,
        `"objectKind" = $${params.push(objectKind)}`,
        `("platformId" IS NULL OR "platformId" = $${params.push(opts.platformId ?? null)})`,
    ]
    if (!isNil(opts.pieceName)) {
        where.push(`"pieceName" = $${params.push(opts.pieceName)}`)
    }
    // Audience exclusion (default all). Expressed as the complement — exclude the audiences the
    // caller did NOT ask for — over COALESCE(audience,'both'), never an `IN (...)` inclusion list:
    // a plain `audience IN (...)` would silently drop NULL-audience rows (SQL `NULL IN` is never
    // true), whereas COALESCE maps an unset audience to 'both' so it survives unless 'both' itself
    // was excluded. Requesting every audience (or omitting the param) yields no clause. Triggers
    // carry no audience (all rows NULL → 'both'), so this is a no-op for them.
    const { audiences } = opts
    if (!isNil(audiences)) {
        const excluded = ALL_AUDIENCES.filter((audience) => !audiences.includes(audience))
        if (excluded.length > 0) {
            where.push(`COALESCE("audience", 'both') <> ALL($${params.push(excluded)}::text[])`)
        }
    }
    const rows = await databaseConnection().query(
        `SELECT "pieceName", "objectName", "displayName", "retrievalDoc", "requiresConnection",
                1 - ("embedding" <=> $1::vector) AS cosine
         FROM "tool_search_index"
         WHERE ${where.join(' AND ')}
         ORDER BY "embedding" <=> $1::vector
         LIMIT $${params.push(Math.max(limit, CANDIDATE_POOL))}`,
        params,
    )

    let candidates: ToolSearchObjectResult[] = rows.map((row: SearchRow): ToolSearchObjectResult => ({
        pieceName: row.pieceName,
        objectName: row.objectName,
        displayName: row.displayName,
        oneLineDescription: extractRetrievalDocDescription(row.retrievalDoc),
        requiresConnection: row.requiresConnection,
        cosine: Number(row.cosine),
    }))

    // Enabled-piece filter (per-tenant): drop objects whose piece is disabled for this caller.
    // The platform/project allow/block lists aren't in the index, so they're resolved out-of-band
    // (the canonical pieceMetadataService.list path) and intersected here. Undefined = no filter
    // (no tenant context, or resolution failed → fail open rather than hide the whole catalog).
    const enabledPieceNames = opts.enabledPieceNames ?? await resolveEnabledPieceNames(opts, log)
    if (!isNil(enabledPieceNames)) {
        candidates = candidates.filter((row) => enabledPieceNames.has(row.pieceName))
    }

    // τ no-match gate on the filtered candidates (top-1 decides abstention), then take the top-k.
    const results = applyNoMatchGate(candidates, embedder.tau).slice(0, limit)

    // Fold per-tenant connection status onto each surviving row so the agent knows which objects
    // are ready to use vs. need a connection set up first. Left undefined when no connection
    // context is available (a platform-scoped, project-less call) or resolution failed.
    const connectedPieceNames = opts.connectedPieceNames ?? await resolveConnectedPieceNames(opts, log)
    if (!isNil(connectedPieceNames)) {
        for (const row of results) {
            row.connected = connectedPieceNames.has(row.pieceName)
        }
    }
    return { results, mode: 'semantic' }
}

/**
 * The keyword floor: the pre-existing Fuse catalog search (the engine behind `ap_research_pieces`),
 * reshaped into the object-row envelope. Reuses `pieceMetadataService.list` — which already applies the
 * caller's platform/project enabled-piece filtering — with the matching suggestion type, then flattens
 * the matched actions/triggers. A best-effort lexical fallback: it does not replicate the semantic
 * path's audience or connection filters (no embeddings means no τ gate either). Flagged `mode:"keyword"`.
 */
async function keywordSearch({ objectKind, query, opts, log, degradeReason }: KeywordSearchParams): Promise<ToolSearchObjectResponse> {
    const limit = opts.limit ?? DEFAULT_LIMIT
    const pieces = await pieceMetadataService(log).list({
        platformId: opts.platformId,
        projectId: opts.projectId,
        includeHidden: false,
        searchQuery: query,
        suggestionType: objectKind === 'action' ? SuggestionType.ACTION : SuggestionType.TRIGGER,
        audience: PieceAudienceFilter.ALL,
    })

    // Honor the caller's pieceName scope in the keyword floor too. `pieceMetadataService.list`
    // searches the whole catalog, so without this the semantic path's pieceName restriction would
    // silently vanish on degrade — a piece-scoped query would return arbitrary other pieces' rows.
    const scopedPieces = isNil(opts.pieceName)
        ? pieces
        : pieces.filter((piece) => piece.name === opts.pieceName)

    const results = scopedPieces.flatMap((piece) => {
        const suggestions = objectKind === 'action' ? (piece.suggestedActions ?? []) : (piece.suggestedTriggers ?? [])
        return suggestions.map((object): ToolSearchObjectResult => ({
            pieceName: piece.name,
            objectName: object.name,
            displayName: object.displayName,
            oneLineDescription: object.description,
            requiresConnection: object.requireAuth,
        }))
    }).slice(0, limit)
    return { results, mode: 'keyword', degradeReason }
}

const CONNECTION_LOOKUP_CAP = 1000

/**
 * The set of piece names enabled for this caller, via the canonical piece-metadata list (which applies
 * the platform + project allow/block filtering — the single source of truth used everywhere else).
 * Returns `undefined` (= no filter) when there is no platform context or the lookup fails, so a
 * transient error fails open (the tenant-isolation SQL still applies) rather than hiding the catalog.
 */
async function resolveEnabledPieceNames(opts: ToolSearchParams, log: FastifyBaseLogger): Promise<ReadonlySet<string> | undefined> {
    const { platformId, projectId } = opts
    if (isNil(platformId)) {
        return undefined
    }
    const { data: pieces, error } = await tryCatch(() => pieceMetadataService(log).list({
        platformId,
        projectId,
        includeHidden: false,
        audience: PieceAudienceFilter.ALL,
    }))
    if (isNil(pieces)) {
        log.warn({ error, platformId }, '[toolSearchService] Enabled-piece resolution failed — serving without the enabled filter.')
        return undefined
    }
    return new Set(pieces.map((piece) => piece.name))
}

/**
 * The set of piece names the calling project has an active connection for, folded onto each row's
 * `connected` flag. Needs a project scope (connections are project-scoped); `undefined` (= flag left
 * unset) when project-less or on lookup failure. One bounded list call — a project realistically holds
 * far fewer than the cap, so distinct piece coverage is complete.
 */
async function resolveConnectedPieceNames(opts: ToolSearchParams, log: FastifyBaseLogger): Promise<ReadonlySet<string> | undefined> {
    const { platformId, projectId } = opts
    if (isNil(projectId) || isNil(platformId)) {
        return undefined
    }
    const { data: connections, error } = await tryCatch(() => appConnectionService(log).list({
        projectId,
        platformId,
        status: [AppConnectionStatus.ACTIVE],
        cursorRequest: null,
        scope: undefined,
        displayName: undefined,
        pieceName: undefined,
        externalIds: undefined,
        limit: CONNECTION_LOOKUP_CAP,
    }))
    if (isNil(connections)) {
        log.warn({ error, projectId }, '[toolSearchService] Connection-status resolution failed — connected flag left unset.')
        return undefined
    }
    return new Set(connections.data.map((connection) => connection.pieceName))
}

function toActionResult(row: ToolSearchObjectResult): ToolSearchActionResult {
    const { objectName, ...rest } = row
    return { ...rest, actionName: objectName }
}

function toTriggerResult(row: ToolSearchObjectResult): ToolSearchTriggerResult {
    const { objectName, ...rest } = row
    return { ...rest, triggerName: objectName }
}

type ToolSearchParams = {
    platformId?: string
    projectId?: string
    limit?: number
    /** Restrict results to a single piece's objects (exact, fully-qualified piece name). */
    pieceName?: string
    /**
     * Audiences the caller wants to see. Omit (or pass all of `human`/`ai`/`both`) for no filtering.
     * Passing a subset excludes the others while keeping NULL-audience rows (treated as 'both').
     * Applies to actions only — trigger rows have no audience.
     */
    audiences?: string[]
    /**
     * Fully-qualified names of the pieces enabled for this caller (platform + project allow/block
     * lists, resolved via the canonical piece-metadata list). Results are intersected with this set.
     * Omit to skip the filter (e.g. when no tenant context is available).
     */
    enabledPieceNames?: ReadonlySet<string>
    /**
     * Fully-qualified names of pieces this caller has an active connection for. Each returned row's
     * `connected` flag is set from this set. Omit when there is no connection context (project-less).
     */
    connectedPieceNames?: ReadonlySet<string>
    embedder?: ToolSearchEmbedder | null
}

type SemanticSearchParams = {
    objectKind: ObjectKind
    query: string
    opts: ToolSearchParams
    embedder: ToolSearchEmbedder
    log: FastifyBaseLogger
}

type KeywordSearchParams = {
    objectKind: ObjectKind
    query: string
    opts: ToolSearchParams
    log: FastifyBaseLogger
    /** Why the semantic path was skipped — surfaced so the tool note names the real cause. */
    degradeReason: ToolSearchDegradeReason
}

type SearchRow = {
    pieceName: string
    objectName: string
    displayName: string
    retrievalDoc: string
    requiresConnection: boolean
    cosine: number | string
}

/** Internal, object-kind-agnostic result row (keyed by generic `objectName`). */
type ToolSearchObjectResult = {
    pieceName: string
    objectName: string
    displayName: string
    oneLineDescription: string | undefined
    requiresConnection: boolean
    /** Cosine similarity in semantic mode; omitted in the keyword floor (no embeddings). */
    cosine?: number
    /** Whether the calling tenant has an active connection for this piece. Undefined = not resolved. */
    connected?: boolean
}

type ToolSearchObjectResponse = {
    results: ToolSearchObjectResult[]
    mode: 'semantic' | 'keyword'
    /** Present only in keyword mode: distinguishes an unconfigured model from a failed embed call. */
    degradeReason?: ToolSearchDegradeReason
}

export type ToolSearchActionResult = Omit<ToolSearchObjectResult, 'objectName'> & {
    actionName: string
}

export type ToolSearchTriggerResult = Omit<ToolSearchObjectResult, 'objectName'> & {
    triggerName: string
}

/**
 * Why a search degraded to the keyword floor. `no-embedder` = no embedding model is configured
 * (nothing to fund the semantic path); `embed-failed` = a model IS configured but its embed/query
 * call failed (a transient outage). The tool text names the real cause instead of always blaming config.
 */
export type ToolSearchDegradeReason = 'no-embedder' | 'embed-failed'

export type ToolSearchActionResponse = {
    results: ToolSearchActionResult[]
    mode: 'semantic' | 'keyword'
    degradeReason?: ToolSearchDegradeReason
}

export type ToolSearchTriggerResponse = {
    results: ToolSearchTriggerResult[]
    mode: 'semantic' | 'keyword'
    degradeReason?: ToolSearchDegradeReason
}
