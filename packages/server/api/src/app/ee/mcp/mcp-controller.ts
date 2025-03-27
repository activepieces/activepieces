import { MCPStatus } from '@activepieces/ee-shared'
import { ALL_PRINCIPAL_TYPES, ApId, Permission, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { mcpService } from './mcp-service'
import { createMcpServer } from './mcp-server'
import { McpSessionManager } from './mcp-session-manager'

let sessionManager: McpSessionManager;

export const mcpController: FastifyPluginAsyncTypebox = async (app) => {
    sessionManager = new McpSessionManager(app.log);
    
    app.get('/', GetMCPRequest, async (req) => {
        return mcpService(req.log).getOrCreate({
            projectId: req.principal.projectId,
        })
    })

    app.patch('/:id/status', UpdateMCPStatusRequest, async (req) => {
        const mcpId = req.params.id;
        const { status } = req.body;
        
        // If status is being set to DISABLED, disconnect any active sessions
        if (status === MCPStatus.DISABLED) {
            const sessionData = sessionManager.getByMcpId(mcpId);
            if (sessionData) {
                sessionManager.remove(sessionData.transport.sessionId);
            }
        }
        
        return mcpService(req.log).updateStatus({
            mcpId,
            status,
        })
    })

    app.patch('/:id/connections', UpdateMCPConnectionsRequest, async (req) => {
        const mcpId = req.params.id;
        const { connectionsIds } = req.body;
        
        const sessionData = sessionManager.getByMcpId(mcpId);
        if (sessionData) {
            sessionManager.remove(sessionData.transport.sessionId);
        }
        
        return mcpService(req.log).updateConnections({
            mcpId,
            connectionsIds,
        })
    })

    app.delete('/:id', DeleteMCPRequest, async (req) => {
        const mcpId = req.params.id;
        
        const sessionData = sessionManager.getByMcpId(mcpId);
        if (sessionData) {
            sessionManager.remove(sessionData.transport.sessionId);
        }
        
        return mcpService(req.log).delete({
            mcpId,
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
        
        const { server, transport } = await createMcpServer({
            mcpId,
            reply,
            logger: req.log,
        });
        
        await server.connect(transport);
        
        sessionManager.add(transport.sessionId, server, transport, mcpId);
        
        reply.raw.on("close", () => {
            sessionManager.remove(transport.sessionId);
        });
    })

    app.post('/messages', {
        config: {
            allowedPrincipals: ALL_PRINCIPAL_TYPES,
        },
        schema: {
            querystring: Type.Object({
                sessionId: Type.Optional(Type.String()),
            }),
        },
    }, async (req, reply) => {
        const sessionId = req.query?.sessionId as string;
        
        if (!sessionId) {
            reply.code(400).send({ message: 'Missing session ID' });
            return;
        }
        
        const sessionData = sessionManager.get(sessionId);
        
        if (!sessionData) {
            reply.code(404).send({ message: 'Session not found' });
            return;
        }
        
        await sessionData.transport.handlePostMessage(req.raw, reply.raw, req.body);
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
