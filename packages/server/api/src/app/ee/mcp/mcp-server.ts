import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { pieceMetadataService } from '../../pieces/piece-metadata-service';
import { projectService } from '../../project/project-service';
import { mcpService } from './mcp-service';
import { FastifyReply } from "fastify";
import { PieceProperty, PropertyType } from '@activepieces/pieces-framework';
import { FastifyBaseLogger } from 'fastify';
import { EngineHelperResponse } from "packages/server/worker/src/lib/engine/engine-runner";
import { EngineResponseStatus, ExecuteActionResponse } from "@activepieces/shared";
import { UserInteractionJobType } from "@activepieces/server-shared";
import { userInteractionWatcher } from "../../workers/user-interaction-watcher";

export async function createMcpServer({
    mcpId,
    reply,
    logger,
}: CreateMcpServerRequest): Promise<CreateMcpServerResponse> {
    const mcp = await mcpService(logger).getOrThrow({ mcpId, log: logger });
    const projectId = mcp.projectId;
    const platformId = await projectService.getPlatformId(projectId);
    const connections = mcp.connections;

    const pieceNames = connections.map((connection) => connection.pieceName);
    const pieces = await Promise.all(pieceNames.map(async (pieceName) => {
        return await pieceMetadataService(logger).getOrThrow({
            name: pieceName,
            version: undefined,
            projectId: projectId,
            platformId: platformId,
        });
    }));

    const transport = new SSEServerTransport('/v1/mcp/messages', reply.raw);
    const server = new McpServer({
        name: "Activepieces",
        version: "1.0.0"
    });

    const uniqueActions = new Set();
    pieces.flatMap(piece =>
        Object.values(piece.actions).map(action => {
            if (uniqueActions.has(action.name)) {
                return;
            }
            const pieceConnectionExternalId = connections.find(connection => connection.pieceName === piece.name)?.externalId;
            uniqueActions.add(action.name);
            server.tool(
                action.name,
                action.description,
                Object.fromEntries(
                    Object.entries(action.props).filter(([key, prop]) => prop.type !== PropertyType.MARKDOWN).map(([key, prop]) =>
                        [key, piecePropertyToZod(prop)]
                    )
                ),
                async (params) => {
                    const result = await userInteractionWatcher(logger).submitAndWaitForResponse<EngineHelperResponse<ExecuteActionResponse>>({
                        jobType: UserInteractionJobType.EXECUTE_TOOL,
                        actionName: action.name,
                        pieceName: piece.name,
                        pieceVersion: piece.version,
                        packageType: piece.packageType,
                        pieceType: piece.pieceType,
                        input: {
                            'auth': `{{connections['${pieceConnectionExternalId}']}}`,
                            ...params,
                        },
                        projectId,
                    })

                    if (result.status === EngineResponseStatus.OK) {
                        return {
                            content: [{
                                type: "text",
                                text: `✅ Successfully executed ${action.displayName}\n\n` +
                                    `${action.description}\n\n` +
                                    `\`\`\`json\n${JSON.stringify(result.result, null, 2)}\n\`\`\``
                            }]
                        }
                    } else {
                        return {
                            content: [{
                                type: "text",
                                text: `❌ Error executing ${action.displayName}\n\n` +
                                    `${action.description}\n\n` +
                                    `\`\`\`\n${result.standardError || "Unknown error occurred"}\n\`\`\``
                            }]
                        }
                    }
                }
            );
        })
    );

    return { server, transport };
}

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
            schema = z.array(z.unknown());
            break;
        case PropertyType.OBJECT:
        case PropertyType.JSON:
            schema = z.record(z.string(), z.unknown());
            break;
        case PropertyType.MULTI_SELECT_DROPDOWN:
            schema = z.array(z.string());
            break;
        case PropertyType.DROPDOWN:
            schema = z.string();
            break;
        default:
            schema = z.unknown();
    }

    if (property.description) {
        schema = schema.describe(property.description);
    }

    return property.required ? schema : schema.optional();
}

export type CreateMcpServerRequest = {
    mcpId: string,
    reply: FastifyReply,
    logger: FastifyBaseLogger,
}

export type CreateMcpServerResponse = {
    server: McpServer;
    transport: SSEServerTransport;
}