import { AppConnectionStatus, isNil, SuggestionType, tryCatch } from '@activepieces/shared'
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

export const toolSearchService = (log: FastifyBaseLogger) => ({
    /**
     * Action search with a keyword floor. When an embedder is available, run the full semantic
     * pipeline ({@link semanticSearchActions}: cosine scan + Phase-4 filters + τ gate + connected flag).
     * When no embedder/AI key resolves — or a live embed/query call fails — degrade to the keyword floor
     * ({@link keywordSearchActions}: the pre-existing Fuse catalog search behind `ap_research_pieces`),
     * reshaped into the same action-row envelope and flagged `mode:"keyword"` so the agent knows the
     * matches are lexical, not semantic (ENGINE_IMPLEMENTATION §8). The tool never hard-fails.
     */
    async searchActions(query: string, opts: SearchActionsParams): Promise<ToolSearchResponse> {
        const embedder = opts.embedder ?? (isNil(opts.platformId)
            ? null
            : await resolveEmbedder({ platformId: opts.platformId, log }))
        if (isNil(embedder)) {
            return keywordSearchActions({ query, opts, log })
        }

        const semantic = await tryCatch(() => semanticSearchActions({ query, opts, embedder, log }))
        if (semantic.error !== null) {
            log.warn({ error: semantic.error }, '[toolSearchService#searchActions] Semantic search failed — degrading to the keyword floor.')
            return keywordSearchActions({ query, opts, log })
        }
        return semantic.data
    },
})

async function semanticSearchActions({ query, opts, embedder, log }: SemanticSearchParams): Promise<ToolSearchResponse> {
    const [queryVector] = await embedder.embed([query])
    const limit = opts.limit ?? DEFAULT_LIMIT

    // Build the candidate query filter-by-filter so each clause is parameter-bound. Tenant
    // isolation, audience exclusion and the optional pieceName scope are all expressible in SQL.
    const params: unknown[] = [`[${queryVector.join(',')}]`, embedder.modelVersion]
    const where = [
        '"embedding" IS NOT NULL',
        `"modelVersion" = $${params.length}`,
        `"objectKind" = 'action'`,
        `("platformId" IS NULL OR "platformId" = $${params.push(opts.platformId ?? null)})`,
    ]
    if (!isNil(opts.pieceName)) {
        where.push(`"pieceName" = $${params.push(opts.pieceName)}`)
    }
    // Audience exclusion (default all). Expressed as the complement — exclude the audiences the
    // caller did NOT ask for — over COALESCE(audience,'both'), never an `IN (...)` inclusion list:
    // a plain `audience IN (...)` would silently drop NULL-audience rows (SQL `NULL IN` is never
    // true), whereas COALESCE maps an unset audience to 'both' so it survives unless 'both' itself
    // was excluded. Requesting every audience (or omitting the param) yields no clause.
    if (!isNil(opts.audiences)) {
        const excluded = ALL_AUDIENCES.filter((audience) => !opts.audiences!.includes(audience))
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

    let candidates: ToolSearchActionResult[] = rows.map((row: SearchRow): ToolSearchActionResult => ({
        pieceName: row.pieceName,
        actionName: row.objectName,
        displayName: row.displayName,
        oneLineDescription: extractRetrievalDocDescription(row.retrievalDoc),
        requiresConnection: row.requiresConnection,
        cosine: Number(row.cosine),
    }))

    // Enabled-piece filter (per-tenant): drop actions whose piece is disabled for this caller.
    // The platform/project allow/block lists aren't in the index, so they're resolved out-of-band
    // (the canonical pieceMetadataService.list path) and intersected here. Undefined = no filter
    // (no tenant context, or resolution failed → fail open rather than hide the whole catalog).
    const enabledPieceNames = opts.enabledPieceNames ?? await resolveEnabledPieceNames(opts, log)
    if (!isNil(enabledPieceNames)) {
        candidates = candidates.filter((row) => enabledPieceNames.has(row.pieceName))
    }

    // τ no-match gate on the filtered candidates (top-1 decides abstention), then take the top-k.
    const results = applyNoMatchGate(candidates, embedder.tau).slice(0, limit)

    // Fold per-tenant connection status onto each surviving row so the agent knows which actions
    // are ready to run vs. need a connection set up first. Left undefined when no connection
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
 * reshaped into the action-row envelope. Reuses `pieceMetadataService.list` — which already applies the
 * caller's platform/project enabled-piece filtering — with the action suggestion mode, then flattens the
 * matched actions. A best-effort lexical fallback: it does not replicate the semantic path's audience or
 * connection filters (no embeddings means no τ gate either). Flagged `mode:"keyword"`.
 */
async function keywordSearchActions({ query, opts, log }: KeywordSearchParams): Promise<ToolSearchResponse> {
    const limit = opts.limit ?? DEFAULT_LIMIT
    const pieces = await pieceMetadataService(log).list({
        platformId: opts.platformId,
        projectId: opts.projectId,
        includeHidden: false,
        searchQuery: query,
        suggestionType: SuggestionType.ACTION,
    })

    const results = pieces.flatMap((piece) =>
        (piece.suggestedActions ?? []).map((action): ToolSearchActionResult => ({
            pieceName: piece.name,
            actionName: action.name,
            displayName: action.displayName,
            oneLineDescription: action.description,
            requiresConnection: action.requireAuth,
        })),
    ).slice(0, limit)
    return { results, mode: 'keyword' }
}

const CONNECTION_LOOKUP_CAP = 1000

/**
 * The set of piece names enabled for this caller, via the canonical piece-metadata list (which applies
 * the platform + project allow/block filtering — the single source of truth used everywhere else).
 * Returns `undefined` (= no filter) when there is no platform context or the lookup fails, so a
 * transient error fails open (the tenant-isolation SQL still applies) rather than hiding the catalog.
 */
async function resolveEnabledPieceNames(opts: SearchActionsParams, log: FastifyBaseLogger): Promise<ReadonlySet<string> | undefined> {
    const { platformId, projectId } = opts
    if (isNil(platformId)) {
        return undefined
    }
    const { data: pieces, error } = await tryCatch(() => pieceMetadataService(log).list({
        platformId,
        projectId,
        includeHidden: false,
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
async function resolveConnectedPieceNames(opts: SearchActionsParams, log: FastifyBaseLogger): Promise<ReadonlySet<string> | undefined> {
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

type SearchActionsParams = {
    platformId?: string
    projectId?: string
    limit?: number
    /** Restrict results to a single piece's actions (exact, fully-qualified piece name). */
    pieceName?: string
    /**
     * Audiences the caller wants to see. Omit (or pass all of `human`/`ai`/`both`) for no filtering.
     * Passing a subset excludes the others while keeping NULL-audience rows (treated as 'both').
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
    query: string
    opts: SearchActionsParams
    embedder: ToolSearchEmbedder
    log: FastifyBaseLogger
}

type KeywordSearchParams = {
    query: string
    opts: SearchActionsParams
    log: FastifyBaseLogger
}

type SearchRow = {
    pieceName: string
    objectName: string
    displayName: string
    retrievalDoc: string
    requiresConnection: boolean
    cosine: number | string
}

export type ToolSearchActionResult = {
    pieceName: string
    actionName: string
    displayName: string
    oneLineDescription: string | undefined
    requiresConnection: boolean
    /** Cosine similarity in semantic mode; omitted in the keyword floor (no embeddings). */
    cosine?: number
    /** Whether the calling tenant has an active connection for this piece. Undefined = not resolved. */
    connected?: boolean
}

export type ToolSearchResponse = {
    results: ToolSearchActionResult[]
    mode: 'semantic' | 'keyword'
}
