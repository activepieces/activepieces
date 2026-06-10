import {
    isNil,
    LocalesEnum,
    McpToolDefinition,
    PieceCategory,
    ProjectScopedMcpServer,
    SuggestionType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { mcpUtils } from './mcp-utils'

const BULK_LOOKUP_CAP = 20

const researchPiecesSchema = z.object({
    pieceNames: z.array(z.string()).optional().describe('Exact piece names to look up (e.g. ["gmail", "slack", "@activepieces/piece-google-sheets"]). Always returns actions and triggers for each piece.'),
    categories: z.array(z.enum(Object.values(PieceCategory) as [string, ...string[]])).optional(),
    tags: z.array(z.string()).optional(),
    searchQuery: z.string().optional(),
    suggestionType: z.enum(Object.values(SuggestionType) as [string, ...string[]]).optional(),
    locale: z.enum(Object.values(LocalesEnum) as [string, ...string[]]).optional(),
    includeActions: z.boolean().optional(),
    includeTriggers: z.boolean().optional(),
})

export const apResearchPiecesTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_research_pieces',
        description: 'Research available pieces. Use pieceNames for bulk exact lookup (always returns actions and triggers). Use searchQuery for fuzzy discovery.',
        inputSchema: {
            pieceNames: researchPiecesSchema.shape.pieceNames,
            categories: researchPiecesSchema.shape.categories,
            tags: researchPiecesSchema.shape.tags,
            searchQuery: researchPiecesSchema.shape.searchQuery,
            suggestionType: researchPiecesSchema.shape.suggestionType,
            locale: researchPiecesSchema.shape.locale,
            includeActions: z.boolean().optional().describe('When true, include action names and descriptions for each piece (only applies to searchQuery mode)'),
            includeTriggers: z.boolean().optional().describe('When true, include trigger names and descriptions for each piece (only applies to searchQuery mode)'),
        },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const params = researchPiecesSchema.parse(args ?? {})
                const platformId = await mcpUtils.resolvePlatformId({ mcp, log })
                const projectId = mcpUtils.isProjectScoped(mcp) ? mcp.projectId : undefined

                if (params.pieceNames && params.pieceNames.length > 0) {
                    return await bulkLookup({
                        pieceNames: params.pieceNames,
                        projectId,
                        platformId,
                        log,
                    })
                }

                return await searchPieces({
                    params,
                    projectId,
                    platformId,
                    log,
                })
            }
            catch (err) {
                return mcpUtils.mcpToolError('Failed to research pieces', err)
            }
        },
    }
}

function summarizeComponent(c: { name: string, displayName: string, description: string, requireAuth: boolean }): ComponentSummary {
    return { name: c.name, displayName: c.displayName, description: c.description, requiresAuth: c.requireAuth }
}

async function bulkLookup({ pieceNames, projectId, platformId, log }: {
    pieceNames: string[]
    projectId: string | undefined
    platformId: string
    log: FastifyBaseLogger
}): Promise<{ content: [{ type: 'text', text: string }], structuredContent: Record<string, unknown> }> {
    const capped = pieceNames.slice(0, BULK_LOOKUP_CAP)
    const svc = pieceMetadataService(log)
    const results = await Promise.all(capped.map(async (rawName) => {
        const normalized = mcpUtils.normalizePieceName(rawName)
        if (isNil(normalized)) {
            return { name: rawName, found: false as const }
        }
        const piece = await svc.get({ name: normalized, projectId, platformId })
        if (isNil(piece)) {
            return { name: normalized, found: false as const }
        }
        return {
            name: piece.name,
            found: true as const,
            displayName: piece.displayName,
            description: piece.description,
            actions: Object.values(piece.actions).map(summarizeComponent),
            triggers: Object.values(piece.triggers).map(summarizeComponent),
        }
    }))

    const found = results.filter((r) => r.found)
    const missing = results.filter((r) => !r.found)
    const hints: string[] = []
    if (missing.length > 0) {
        hints.push(`⚠️ Not found: ${missing.map((m) => m.name).join(', ')}`)
    }
    if (pieceNames.length > BULK_LOOKUP_CAP) {
        hints.push(`⚠️ Only the first ${BULK_LOOKUP_CAP} pieces were looked up (${pieceNames.length} requested)`)
    }
    const hintText = hints.length > 0 ? `\n\n${hints.join('\n')}` : ''

    return {
        content: [{ type: 'text', text: `✅ Researched ${found.length} piece(s)${hintText}:\n${JSON.stringify(found)}` }],
        structuredContent: {
            pieces: found,
            missing: missing.map((m) => m.name),
            count: found.length,
        },
    }
}

async function searchPieces({ params, projectId, platformId, log }: {
    params: z.infer<typeof researchPiecesSchema>
    projectId: string | undefined
    platformId: string
    log: FastifyBaseLogger
}): Promise<{ content: [{ type: 'text', text: string }], structuredContent: Record<string, unknown> }> {
    const svc = pieceMetadataService(log)
    const pieces = await svc.list({
        projectId,
        platformId,
        includeHidden: false,
        categories: params.categories as PieceCategory[] | undefined,
        tags: params.tags,
        searchQuery: params.searchQuery,
        suggestionType: params.suggestionType as SuggestionType | undefined,
        locale: params.locale as LocalesEnum | undefined,
    })

    if (!params.includeActions && !params.includeTriggers) {
        const totalCount = pieces.length
        const LIST_CAP = 50
        const capped = pieces.slice(0, LIST_CAP).map((p) => ({
            name: p.name,
            displayName: p.displayName,
            description: p.description,
            actions: p.actions,
            triggers: p.triggers,
        }))
        const hint = totalCount > LIST_CAP ? ` (showing ${LIST_CAP} of ${totalCount} — use searchQuery to narrow results)` : ''
        return {
            content: [{ type: 'text', text: `✅ Found pieces${hint}:\n${JSON.stringify(capped)}` }],
            structuredContent: {
                pieces: capped.map((p) => ({ name: p.name, displayName: p.displayName, description: p.description })),
                count: capped.length,
                totalCount,
            },
        }
    }

    const totalCount = pieces.length
    const ENRICHED_CAP = 10
    const piecesToEnrich = pieces.slice(0, ENRICHED_CAP)
    const enrichedPieces = await Promise.all(piecesToEnrich.map(async (piece) => {
        const enriched: EnrichedPiece = {
            name: piece.name,
            displayName: piece.displayName,
            description: piece.description,
        }
        const fullPiece = await svc.get({
            name: piece.name,
            version: piece.version,
            projectId,
            platformId,
        })
        if (fullPiece) {
            if (params.includeActions) {
                enriched.actions = Object.values(fullPiece.actions).map(summarizeComponent)
            }
            if (params.includeTriggers) {
                enriched.triggers = Object.values(fullPiece.triggers).map(summarizeComponent)
            }
        }
        return enriched
    }))

    const overflowHint = totalCount > ENRICHED_CAP
        ? ` (showing top ${ENRICHED_CAP} of ${totalCount} results — use a more specific searchQuery to narrow results)`
        : ''
    return {
        content: [{ type: 'text', text: `✅ Found pieces${overflowHint}:\n${JSON.stringify(enrichedPieces)}` }],
        structuredContent: {
            pieces: enrichedPieces,
            count: enrichedPieces.length,
            totalCount,
        },
    }
}

type ComponentSummary = {
    name: string
    displayName: string
    description: string
    requiresAuth: boolean
}

type EnrichedPiece = {
    name: string
    displayName: string
    description: string
    actions?: ComponentSummary[]
    triggers?: ComponentSummary[]
}
