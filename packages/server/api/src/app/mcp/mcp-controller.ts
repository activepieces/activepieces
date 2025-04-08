import { ALL_PRINCIPAL_TYPES, apId, ApId, MCP, Permission, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { mcpService } from './mcp-service'

export const mcpController: FastifyPluginAsyncTypebox = async (app) => {

    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    app.get('/', GetMCPRequest, async (req) => {
        return mcpService(req.log).getOrCreate({
            projectId: req.principal.projectId,
        })
    })

    app.post('/:id', UpdateMCPRequest, async (req) => {
        const mcpId = req.params.id
        const { token, connectionsIds } = req.body

        return mcpService(req.log).update({
            mcpId,
            token,
            connectionsIds,
        })
    })

    app.post('/:id/rotate', RotateTokenRequest, async (req) => {
        const mcpId = req.params.id
        return mcpService(req.log).update({
            mcpId,
            token: apId(),
        })
    })

    app.delete('/:id', DeleteMCPRequest, async (req) => {
        const mcpId = req.params.id
        return mcpService(req.log).delete({
            mcpId,
        })
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
