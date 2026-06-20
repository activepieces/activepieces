import { isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { databaseConnection } from '../database/database-connection'
import { ToolSearchEmbedder } from './embedder'
import { resolveEmbedder } from './resolve-embedder'
import { extractRetrievalDocDescription } from './retrieval-doc'

const DEFAULT_LIMIT = 5

export const toolSearchService = (log: FastifyBaseLogger) => ({
    /**
     * Phase 1: semantic action search. Embed the query with the same model + L2-normalization used
     * at index time, run the exact cosine `<=>` scan over embedded rows under tenant isolation, and
     * return a top-k tiered envelope (lightweight rows — the agent fetches schemas on demand via
     * `ap_get_piece_props`). Deliberately deferred: the τ no-match gate (Phase 2), the audience /
     * connection-status filters (Phase 4), and the keyword floor (Phase 5).
     */
    async searchActions(query: string, opts: SearchActionsParams): Promise<ToolSearchResponse> {
        const embedder = opts.embedder ?? (isNil(opts.platformId)
            ? null
            : await resolveEmbedder({ platformId: opts.platformId, log }))
        if (isNil(embedder)) {
            return { results: [], mode: 'semantic' }
        }

        const [queryVector] = await embedder.embed([query])
        const limit = opts.limit ?? DEFAULT_LIMIT
        const rows = await databaseConnection().query(
            `SELECT "pieceName", "objectName", "displayName", "retrievalDoc", "requiresConnection",
                    1 - ("embedding" <=> $1::vector) AS cosine
             FROM "tool_search_index"
             WHERE "embedding" IS NOT NULL
               AND "modelVersion" = $2
               AND "objectKind" = 'action'
               AND ("platformId" IS NULL OR "platformId" = $3)
             ORDER BY "embedding" <=> $1::vector
             LIMIT $4`,
            [`[${queryVector.join(',')}]`, embedder.modelVersion, opts.platformId ?? null, limit],
        )

        const results = rows.map((row: SearchRow): ToolSearchActionResult => ({
            pieceName: row.pieceName,
            actionName: row.objectName,
            displayName: row.displayName,
            oneLineDescription: extractRetrievalDocDescription(row.retrievalDoc),
            requiresConnection: row.requiresConnection,
            cosine: Number(row.cosine),
        }))
        return { results, mode: 'semantic' }
    },
})

type SearchActionsParams = {
    platformId?: string
    projectId?: string
    limit?: number
    embedder?: ToolSearchEmbedder | null
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
    cosine: number
}

export type ToolSearchResponse = {
    results: ToolSearchActionResult[]
    mode: 'semantic' | 'keyword'
}
