import { ApId, apId, ListMcpsRequest, McpWithPieces, Permission, PrincipalType, ProjectId, SeekPage, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../authentication/authorization'
import { mcpService } from './mcp-service'

const DEFAULT_PAGE_SIZE = 10



export const mcpServerController: FastifyPluginAsyncTypebox = async (app) => {

    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    app.post('/', CreateMcpRequest, async (req) => {
        let projectId: ProjectId
        
        if (req.principal.type === PrincipalType.SERVICE) {
            if (!req.query.projectId) {
                return null;
            }
            projectId = req.query.projectId
        }
        else {
            projectId = req.principal.projectId
        }
        return mcpService(req.log).upsert({
            projectId,
        })
    })
    
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
            limit: req.query.limit ?? DEFAULT_PAGE_SIZE,
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

const CreateMcpRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.WRITE_MCP],
    },
    schema: {
        tags: ['mcp'],
        description: 'Create a new MCP server',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: Type.Object({
            projectId: Type.Optional(Type.String({})),
        }),
        response: {
            [StatusCodes.OK]: Type.Union([McpWithPieces, Type.Null()]),
        },
    },
}

const GetMcpsRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.READ_MCP],
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
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.WRITE_MCP],
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
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.WRITE_MCP],
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
