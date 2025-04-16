import { ALL_PRINCIPAL_TYPES, ApId, apId, MCP, Permission, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
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
        tags: ['mcp'],
        description: 'Get the project MCP server configuration',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
    schema: {
        response: {
            [StatusCodes.OK]: MCP,
        },
    },
}

export const UpdateMCPRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        tags: ['mcp'],
        description: 'Update the project MCP server configuration',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
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
        tags: ['mcp'],
        description: 'Rotate the MCP token',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
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
        tags: ['mcp'],
        description: 'Delete the project MCP server configuration',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            id: ApId,
        }),
    },
}
