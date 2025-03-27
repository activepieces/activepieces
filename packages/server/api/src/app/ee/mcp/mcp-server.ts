import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { pieceMetadataService } from '../../pieces/piece-metadata-service';
import { projectService } from '../../project/project-service';
import { mcpService } from './mcp-service';
import { FastifyReply } from "fastify";
import { PieceProperty, PropertyType } from '@activepieces/pieces-framework';
import { FastifyBaseLogger } from 'fastify';

/**
 * Creates an MCP server instance for a given MCP ID
 */
export async function createMcpServer({
    mcpId,
    reply,
    logger,
}: {
    mcpId: string,
    reply: FastifyReply,
    logger: FastifyBaseLogger,
}): Promise<{
    server: McpServer;
    transport: SSEServerTransport;
}> {
    // Get the project ID from the MCP
    const projectId = await mcpService(logger).getProjectId({
        mcpId,
    });

    // Get the platform ID
    const platformId = await projectService.getPlatformId(projectId);
    
    // Get connections for this MCP
    const connections = await mcpService(logger).getConnections({
        mcpId,
    });

    // Get all pieces for these connections
    const pieceNames = connections.map((connection) => connection.pieceName);
    const pieces = await Promise.all(pieceNames.map(async (pieceName) => {
        return await pieceMetadataService(logger).getOrThrow({
            name: pieceName,
            version: undefined,
            projectId: projectId,
            platformId: platformId,
        });
    }));

    // Create transport and server
    const transport = new SSEServerTransport('/v1/mcp/messages', reply.raw);
    const server = new McpServer({
        name: "Activepieces",
        version: "1.0.0"
    });

    // Register all tools from the pieces
    const uniqueActions = new Set();    
    pieces.flatMap(piece => 
        Object.values(piece.actions).map(action => {
            if (uniqueActions.has(action.name)) {
                return;
            }
            uniqueActions.add(action.name);
            server.tool(
                action.name,
                action.description,
                Object.fromEntries(
                    Object.entries(action.props).map(([key, prop]) => 
                        [key, piecePropertyToZod(prop)]
                    )
                ),
                async (params) => ({
                    content: [{ 
                        type: "text", 
                        text: `Executed ${action.displayName}: ${action.description}` 
                    }]
                })
            );
        })
    );

    return { server, transport };
}

/**
 * Convert a PieceProperty to a Zod schema
 */
function piecePropertyToZod(property: PieceProperty): z.ZodTypeAny {
    let schema: z.ZodTypeAny;
    
    switch (property.type) {
        case PropertyType.SHORT_TEXT:
        case PropertyType.LONG_TEXT:
        case PropertyType.DATE_TIME:
            schema = z.string();
            break;
        case PropertyType.NUMBER:
            schema = z.number();
            break;
        case PropertyType.CHECKBOX:
            schema = z.boolean();
            break;
        case PropertyType.ARRAY:
            schema = z.array(z.any());
            break;
        case PropertyType.OBJECT:
        case PropertyType.JSON:
            schema = z.record(z.string(), z.any());
            break;
        default:
            schema = z.any();
    }
    
    // Add description if available
    if (property.description) {
        schema = schema.describe(property.description);
    }
    
    return property.required ? schema : schema.optional();
} 