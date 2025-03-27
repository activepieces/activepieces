import { ALL_PRINCIPAL_TYPES, ApId, Permission, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { mcpService } from './mcp-service'
import { createMcpServer } from './mcp-server'
import { mcpSessionManager } from './mcp-session-manager'
import { MCP } from '@activepieces/ee-shared'
import { StatusCodes } from 'http-status-codes'

let sessionManager: ReturnType<typeof mcpSessionManager>;

export const mcpController: FastifyPluginAsyncTypebox = async (app) => {
    sessionManager = mcpSessionManager(app.log);
    
    app.get('/', GetMCPRequest, async (req) => {
        return mcpService(req.log).getOrCreate({
            projectId: req.principal.projectId,
        })
    })

    app.post('/:id', UpdateMCPRequest, async (req) => {
        const mcpId = req.params.id;
        const { token, connectionsIds } = req.body;
        
        return mcpService(req.log).update({
            mcpId,
            token,
            connectionsIds,
        });
    })
    
    app.post('/:id/rotate', RotateTokenRequest, async (req) => {
        const mcpId = req.params.id;
        return mcpService(req.log).rotateToken({
            mcpId,
        });
    })

    app.delete('/:id', DeleteMCPRequest, async (req) => {
        const mcpId = req.params.id;
        
        sessionManager.removeAll();
        
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
        const token = req.params.id;
        const mcp = await mcpService(req.log).getByToken({
            token
        });
        
        const { server, transport } = await createMcpServer({
            mcpId: mcp.id,
            reply,
            logger: req.log,
        });
        
        await server.connect(transport);
        
        sessionManager.add(transport.sessionId, server, transport, mcp.id);
        
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
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
}

export const UpdateMCPRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        body: Type.Object({
            token: Type.Optional(Type.String()),
            connectionsIds: Type.Optional(Type.Array(ApId)),
        }),
        response: {
            [StatusCodes.OK]: MCP,
        },
    },
}

const RotateTokenRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: MCP,
        },
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
