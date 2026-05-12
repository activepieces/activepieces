import {
    LocalesEnum,
    McpToolDefinition,
    PieceCategory,
    ProjectScopedMcpServer,
    SuggestionType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { mcpUtils } from './mcp-utils'

const listPiecesSchema = z.object({
    categories: z.array(z.enum(Object.values(PieceCategory) as [string, ...string[]])).optional(),
    tags: z.array(z.string()).optional(),
    searchQuery: z.string().optional(),
    suggestionType: z.enum(Object.values(SuggestionType) as [string, ...string[]]).optional(),
    locale: z.enum(Object.values(LocalesEnum) as [string, ...string[]]).optional(),
    includeActions: z.boolean().optional(),
    includeTriggers: z.boolean().optional(),
})

export const apListPiecesTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_list_pieces',
        description: 'List available pieces with their actions and triggers. Use includeActions/includeTriggers for details.',
        inputSchema: {
            categories: listPiecesSchema.shape.categories,
            tags: listPiecesSchema.shape.tags,
            searchQuery: listPiecesSchema.shape.searchQuery,
            suggestionType: listPiecesSchema.shape.suggestionType,
            locale: listPiecesSchema.shape.locale,
            includeActions: z.boolean().optional().describe('When true, include action names and descriptions for each piece'),
            includeTriggers: z.boolean().optional().describe('When true, include trigger names and descriptions for each piece'),
        },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const params = listPiecesSchema.parse(args ?? {})
                // Resolve platformId so private (CUSTOM) pieces owned by this project's
                // platform show up alongside public (OFFICIAL) ones.
                const project = await projectService(log).getOneOrThrow(mcp.projectId)
                const pieces = await pieceMetadataService(log).list({
                    projectId: mcp.projectId,
                    platformId: project.platformId,
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
                    const capped = pieces.slice(0, LIST_CAP).map(p => ({
                        name: p.name,
                        displayName: p.displayName,
                        description: p.description,
                        actions: p.actions,
                        triggers: p.triggers,
                    }))
                    const hint = totalCount > LIST_CAP ? ` (showing ${LIST_CAP} of ${totalCount} — use searchQuery to narrow results)` : ''
                    return {
                        content: [{ type: 'text', text: `✅ Successfully listed pieces${hint}:\n${JSON.stringify(capped)}` }],
                        structuredContent: {
                            pieces: capped.map(p => ({ name: p.name, displayName: p.displayName, description: p.description })),
                            count: capped.length,
                            totalCount,
                        },
                    }
                }

                const totalCount = pieces.length
                const ENRICHED_CAP = 10
                const piecesToEnrich = pieces.slice(0, ENRICHED_CAP)
                const enrichedPieces = await Promise.all(piecesToEnrich.map(async (piece) => {
                    const base: Record<string, unknown> = {
                        name: piece.name,
                        displayName: piece.displayName,
                        description: piece.description,
                    }
                    const fullPiece = await pieceMetadataService(log).get({
                        name: piece.name,
                        version: piece.version,
                        projectId: mcp.projectId,
                        platformId: project.platformId,
                    })
                    if (fullPiece) {
                        if (params.includeActions) {
                            base.actions = Object.values(fullPiece.actions).map(a => ({
                                name: a.name,
                                displayName: a.displayName,
                                description: a.description,
                                requiresAuth: a.requireAuth,
                            }))
                        }
                        if (params.includeTriggers) {
                            base.triggers = Object.values(fullPiece.triggers).map(t => ({
                                name: t.name,
                                displayName: t.displayName,
                                description: t.description,
                                requiresAuth: t.requireAuth,
                            }))
                        }
                    }
                    return base
                }))

                const overflowHint = totalCount > ENRICHED_CAP
                    ? ` (showing top ${ENRICHED_CAP} of ${totalCount} results — use a more specific searchQuery to narrow results)`
                    : ''
                return {
                    content: [{ type: 'text', text: `✅ Successfully listed pieces${overflowHint}:\n${JSON.stringify(enrichedPieces)}` }],
                    structuredContent: {
                        pieces: enrichedPieces.map(p => ({
                            name: String(p.name),
                            displayName: String(p.displayName),
                            description: String(p.description),
                        })),
                        count: enrichedPieces.length,
                        totalCount,
                    },
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Failed to list pieces', err)
            }
        },
    }
}
