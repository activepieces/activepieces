import { ALL_PRINCIPAL_TYPES, ApId, apId, ListMcpsRequest, McpWithPieces, PrincipalType, ProjectId, SeekPage, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { mcpService } from './mcp-service'

export const mcpServerController: FastifyPluginAsyncTypebox = async (app) => {

    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    
    app.get('/', GetMcpsRequest, async (req) => {
        let projectId: ProjectId
        
        if (req.principal.type === PrincipalType.SERVICE) {
            if (!req.query.projectId) {
                return {
                    data: [],
                    cursor: null,
                }
            }
            projectId = req.query.projectId
        }
        else {
            projectId = req.principal.projectId
        }
        
        const result = await mcpService(req.log).list({
            projectId,
            cursorRequest: req.query.cursor ?? null,
            limit: req.query.limit ?? 10,
        })
        
        return result
    })

    app.post('/:id', UpdateMcpRequest, async (req) => {
        const mcpId = req.params.id
        const { token } = req.body

        return mcpService(req.log).update({
            mcpId,
            token,
        })
    })

    app.post('/:id/rotate', RotateTokenRequest, async (req) => {
        const mcpId = req.params.id
        return mcpService(req.log).update({
            mcpId,
            token: apId(),
        })
    })
}

const GetMcpsRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        tags: ['mcp'],
        description: 'List MCP servers',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListMcpsRequest,
        response: {
            [StatusCodes.OK]: SeekPage(McpWithPieces),
        },
    },
}

export const UpdateMcpRequest = {
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
        }),
        response: {
            [StatusCodes.OK]: McpWithPieces,
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
            [StatusCodes.OK]: McpWithPieces,
        },
    },
}
