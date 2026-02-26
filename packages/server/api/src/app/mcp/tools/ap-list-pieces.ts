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

const listPiecesSchema = z.object({
    categories: z.array(z.nativeEnum(PieceCategory)).optional(),
    tags: z.array(z.string()).optional(),
    searchQuery: z.string().optional(),
    suggestionType: z.nativeEnum(SuggestionType).optional(),
    locale: z.nativeEnum(LocalesEnum).optional(),
})

export const apListPiecesTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_list_pieces',
        description: 'List pieces (pieceName, pieceVersion, actions, triggers). Call before ap_add_step to build valid PIECE actions.',
        inputSchema: {
            categories: listPiecesSchema.shape.categories,
            tags: listPiecesSchema.shape.tags,
            searchQuery: listPiecesSchema.shape.searchQuery,
            suggestionType: listPiecesSchema.shape.suggestionType,
            locale: listPiecesSchema.shape.locale,
        },
        execute: async (args) => {
            const params = listPiecesSchema.parse(args ?? {})
            const pieces = await pieceMetadataService(log).list({
                projectId: mcp.projectId,
                includeHidden: true,
                categories: params.categories,
                tags: params.tags,
                searchQuery: params.searchQuery,
                suggestionType: params.suggestionType,
                locale: params.locale,
            })
            return {
                content: [{ type: 'text', text: `✅ Successfully listed pieces:\n${JSON.stringify(pieces)}` }],
            }
        },
    }
}