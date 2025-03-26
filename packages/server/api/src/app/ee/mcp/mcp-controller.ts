import { MCPStatus } from '@activepieces/ee-shared'
import { ALL_PRINCIPAL_TYPES, ApId, Permission, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { mcpService } from './mcp-service'
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import { pieceMetadataService } from '../../pieces/piece-metadata-service';
import { projectService } from '../../project/project-service';
import { PieceProperty, PropertyType } from '@activepieces/pieces-framework';

let transport: SSEServerTransport;

export const mcpController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', GetMCPRequest, async (req) => {
        return mcpService(req.log).getOrCreate({
            projectId: req.principal.projectId,
        })
    })

    app.patch('/:id/status', UpdateMCPStatusRequest, async (req) => {
        return mcpService(req.log).updateStatus({
            mcpId: req.params.id,
            status: req.body.status,
        })
    })

    app.patch('/:id/connections', UpdateMCPConnectionsRequest, async (req) => {
        return mcpService(req.log).updateConnections({
            mcpId: req.params.id,
            connectionsIds: req.body.connectionsIds,
        })
    })

    app.delete('/:id', DeleteMCPRequest, async (req) => {
        return mcpService(req.log).delete({
            mcpId: req.params.id,
        })
    })

    app.get('/:id/sse', {
        config: {
            allowedPrincipals: ALL_PRINCIPAL_TYPES,
        },
        schema: {
            params: Type.Object({
                id: ApId,
            }),
        },
    }, async (req, reply) => {
        const mcpId = req.params.id;

        const projectId = await mcpService(req.log).getProjectId({
            mcpId: mcpId,
        });

        const platformId = await projectService.getPlatformId(projectId)
        const connections = await mcpService(req.log).getConnections({
            mcpId: mcpId,
        })

        const pieceNames = connections.map((connection) => {
            return connection.pieceName;
        });
        const pieces = await Promise.all(pieceNames.map(async (pieceName) => {
            return await pieceMetadataService(req.log).getOrThrow({
                name: pieceName,
                version: undefined,
                projectId: projectId,
                platformId: platformId,
            })
        }))

        transport = new SSEServerTransport('/v1/mcp/messages', reply.raw);
        const server = new McpServer({
            name: "Activepieces",
            version: "1.0.0"
        });

        // TODO: check if there is a better way to do this
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
            
            return property.required ? schema : schema.optional();
        }
        

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
                )
            }
        ));

        await server.connect(transport)
        
    })

    app.post('/messages', {
        config: {
            allowedPrincipals: ALL_PRINCIPAL_TYPES,
        },
    }, async (req, reply) => {
        await transport.handlePostMessage(req.raw, reply.raw, req.body)
    })

}

const GetMCPRequest = {
    config: {
        permission: Permission.READ_MCP,
        allowedPrincipals: [PrincipalType.USER],
    }
    
}

const UpdateMCPStatusRequest = {
    config: {
        permission: Permission.WRITE_MCP,
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        body: Type.Object({
            status: Type.Enum(MCPStatus),
        }),
    },
}

const UpdateMCPConnectionsRequest = {
    config: {
        permission: Permission.WRITE_MCP,
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        body: Type.Object({
            connectionsIds: Type.Array(Type.String()),
        }),
    },
}

const DeleteMCPRequest = {
    config: {
        permission: Permission.WRITE_MCP,
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
}
