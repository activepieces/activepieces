import { embed } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { databaseConnection } from '../database/database-connection'
import { createCopilotEmbeddingModel } from './create-embedding-model'

export const copilotSearchService = (log: FastifyBaseLogger) => ({
    async search({ query, limit }: { query: string, limit: number }): Promise<SearchResult[]> {
        let vectorResults: RawSearchRow[] = []
        try {
            const { model: embModel, modelId, providerOptions } = createCopilotEmbeddingModel()
            const { embedding } = await embed({ model: embModel, value: query, providerOptions })
            const embeddingStr = `[${embedding.join(',')}]`

            vectorResults = await databaseConnection().query(
                `SELECT cc."id", cc."content", cc."summary", cc."startLine", cc."endLine",
                        cc."functionName", cc."className", cc."chunkType",
                        cc."path" AS "filePath", cc."language",
                        1 - (cc."embedding" <=> $1::vector) AS "score"
                 FROM copilot_code_chunks cc
                 WHERE cc."embeddingModel" = $2
                   AND cc."embedding" IS NOT NULL
                 ORDER BY cc."embedding" <=> $1::vector
                 LIMIT 20`,
                [embeddingStr, modelId],
            )
        }
        catch (err) {
            log.warn({ err }, '[copilotSearch] vector search failed, falling back to text-only')
        }

        const textResults: RawSearchRow[] = await databaseConnection().query(
            `SELECT cc."id", cc."content", cc."summary", cc."startLine", cc."endLine",
                    cc."functionName", cc."className", cc."chunkType",
                    cc."path" AS "filePath", cc."language",
                    ts_rank(cc."searchVector", plainto_tsquery('english', $1)) AS "score"
             FROM copilot_code_chunks cc
             WHERE cc."searchVector" @@ plainto_tsquery('english', $1)
             ORDER BY "score" DESC
             LIMIT 20`,
            [query],
        )

        return mergeResults({ vectorResults, textResults, limit })
    },
})

function mergeResults({ vectorResults, textResults, limit }: MergeResultsParams): SearchResult[] {
    const maxTextScore = textResults.reduce((max, r) => Math.max(max, r.score), 0)

    const merged = new Map<string, SearchResult>()

    for (const row of vectorResults) {
        merged.set(row.id, { ...row, score: 0.7 * row.score })
    }

    for (const row of textResults) {
        const normalizedScore = maxTextScore > 0 ? row.score / maxTextScore : 0
        const existing = merged.get(row.id)
        if (existing) {
            existing.score = existing.score + 0.3 * normalizedScore
        }
        else {
            merged.set(row.id, { ...row, score: 0.3 * normalizedScore })
        }
    }

    return [...merged.values()]
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
}

type RawSearchRow = {
    id: string
    content: string
    summary: string | null
    startLine: number
    endLine: number
    functionName: string | null
    className: string | null
    chunkType: string
    filePath: string
    language: string | null
    score: number
}

type MergeResultsParams = {
    vectorResults: RawSearchRow[]
    textResults: RawSearchRow[]
    limit: number
}

export type SearchResult = {
    id: string
    content: string
    summary: string | null
    startLine: number
    endLine: number
    functionName: string | null
    className: string | null
    chunkType: string
    filePath: string
    language: string | null
    score: number
}
