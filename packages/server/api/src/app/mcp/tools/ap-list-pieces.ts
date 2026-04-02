import {
    LocalesEnum,
    McpServer,
    McpToolDefinition,
    PieceCategory,
    SuggestionType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { mcpToolError } from './mcp-utils'

const listPiecesSchema = z.object({
    categories: z.array(z.enum(Object.values(PieceCategory) as [string, ...string[]])).optional(),
    tags: z.array(z.string()).optional(),
    searchQuery: z.string().optional(),
    suggestionType: z.enum(Object.values(SuggestionType) as [string, ...string[]]).optional(),
    locale: z.enum(Object.values(LocalesEnum) as [string, ...string[]]).optional(),
    includeActions: z.boolean().optional(),
    includeTriggers: z.boolean().optional(),
})

export const apListPiecesTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_list_pieces',
        description: 'List pieces (pieceName, pieceVersion, actions count, triggers count). Use includeActions=true to get action names and descriptions. Use includeTriggers=true to get trigger names and descriptions. Call before ap_add_step or ap_update_trigger to get valid piece names and action/trigger names.',
        inputSchema: {
            categories: listPiecesSchema.shape.categories,
            tags: listPiecesSchema.shape.tags,
            searchQuery: listPiecesSchema.shape.searchQuery,
            suggestionType: listPiecesSchema.shape.suggestionType,
            locale: listPiecesSchema.shape.locale,
            includeActions: z.boolean().optional().describe('When true, include action names and descriptions for each piece'),
            includeTriggers: z.boolean().optional().describe('When true, include trigger names and descriptions for each piece'),
        },
        annotations: { readOnlyHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const params = listPiecesSchema.parse(args ?? {})
                const pieces = await pieceMetadataService(log).list({
                    projectId: mcp.projectId,
                    includeHidden: true,
                    categories: params.categories as PieceCategory[] | undefined,
                    tags: params.tags,
                    searchQuery: params.searchQuery,
                    suggestionType: params.suggestionType as SuggestionType | undefined,
                    locale: params.locale as LocalesEnum | undefined,
                })

                if (!params.includeActions && !params.includeTriggers) {
                    const totalCount = pieces.length
                    const capped = pieces.slice(0, 50)
                    const hint = totalCount > 50 ? ` (showing 50 of ${totalCount} — use searchQuery to narrow results)` : ''
                    return {
                        content: [{ type: 'text', text: `✅ Successfully listed pieces${hint}:\n${JSON.stringify(capped)}` }],
                    }
                }

                const totalCount = pieces.length
                const piecesToEnrich = pieces.slice(0, 50)
                const enrichedPieces = await Promise.all(piecesToEnrich.map(async (piece) => {
                    const base: Record<string, unknown> = {
                        name: piece.name,
                        displayName: piece.displayName,
                        version: piece.version,
                        description: piece.description,
                    }
                    const fullPiece = await pieceMetadataService(log).get({
                        name: piece.name,
                        version: piece.version,
                        projectId: mcp.projectId,
                        platformId: undefined,
                    })
                    if (fullPiece) {
                        if (params.includeActions) {
                            base.actions = Object.values(fullPiece.actions).map(a => ({
                                name: a.name,
                                displayName: a.displayName,
                                description: a.description,
                            }))
                        }
                        if (params.includeTriggers) {
                            base.triggers = Object.values(fullPiece.triggers).map(t => ({
                                name: t.name,
                                displayName: t.displayName,
                                description: t.description,
                            }))
                        }
                    }
                    return base
                }))

                return {
                    content: [{ type: 'text', text: `✅ Successfully listed pieces${totalCount > piecesToEnrich.length ? ` (showing ${piecesToEnrich.length} of ${totalCount} — use searchQuery to narrow results)` : ''}:\n${JSON.stringify(enrichedPieces)}` }],
                }
            }
            catch (err) {
                return mcpToolError('Failed to list pieces', err)
            }
        },
    }
}
