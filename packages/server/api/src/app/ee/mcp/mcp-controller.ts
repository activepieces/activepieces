import { MCPStatus } from '@activepieces/ee-shared'
import { ALL_PRINCIPAL_TYPES, ApId, Permission, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { mcpService } from './mcp-service'
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
const server = new McpServer({
    name: "My App",
    version: "1.0.0"
});
server.tool(
    "echo",
    { message: z.string() },
    async ({ message }) => ({
        content: [{ type: "text", text: `Tool echo: ${message}` }]
    })
);
let transport: SSEServerTransport;

export const mcpController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/', GetMCPRequest, async (req) => {
        return mcpService(req.log).getOrCreate({
            projectId: req.query.projectId,
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

    app.get('/sse', {
        config: {
            permission: Permission.READ_MCP,
            allowedPrincipals: ALL_PRINCIPAL_TYPES,
        },
    }, async (req, reply) => {
        transport = new SSEServerTransport('/v1/mcp/messages', reply.raw);

        await transport.start()
  
        
    })

    app.post('/messages', {
        config: {
            permission: Permission.READ_MCP,
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
    },
    schema: {
        querystring: Type.Object({
            projectId: ApId,
        }),
    },
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
