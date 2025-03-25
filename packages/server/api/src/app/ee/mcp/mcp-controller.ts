import { MCPStatus } from '@activepieces/ee-shared'
import { ApId, Permission, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { mcpService } from './mcp-service'

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
