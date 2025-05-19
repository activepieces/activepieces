import { apId, ApId, CreateMcpRequestBody, ListMcpsRequest, McpWithPieces, Permission, PrincipalType, ProjectId, SeekPage, SERVICE_KEY_SECURITY_OPENAPI, UpdateMcpRequestBody } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { mcpService } from './mcp-service'

const DEFAULT_PAGE_SIZE = 10

const getProjectIdFromRequest = (req: FastifyRequest): ProjectId | null => {
    if (req.principal.type === PrincipalType.SERVICE) {
        if (!(req.query as { projectId?: ProjectId }).projectId) {
            return null
        }
        return (req.query as { projectId: ProjectId }).projectId
    }
    return req.principal.projectId
}

export const mcpServerController: FastifyPluginAsyncTypebox = async (app) => {

    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    app.post('/', CreateMcpRequest, async (req) => {
        const projectId = getProjectIdFromRequest(req)
        if (!projectId) {
            return null
        }
        return mcpService(req.log).create({
            projectId,
            name: req.body.name,
        })
    })
    
    app.get('/', GetMcpsRequest, async (req) => {
        const projectId = getProjectIdFromRequest(req)
        if (!projectId) {
            return {
                data: [],
                cursor: null,
            }
        }
        
        const result = await mcpService(req.log).list({
            projectId,
            cursorRequest: req.query.cursor ?? null,
            limit: req.query.limit ?? DEFAULT_PAGE_SIZE,
            name: req.query.name ?? undefined,
        })
        
        return result
    })

    app.get('/:id', GetMcpRequest, async (req) => {
        const mcpId = req.params.id
        return mcpService(req.log).getOrThrow({
            mcpId,
        })
    })

    app.post('/:id', UpdateMcpRequest, async (req) => {
        const mcpId = req.params.id
        const { token, name } = req.body

        return mcpService(req.log).update({
            mcpId,
            token,
            name,
        })
    })

    app.post('/:id/rotate', RotateTokenRequest, async (req) => {
        const mcpId = req.params.id
        return mcpService(req.log).update({
            mcpId,
            token: apId(),
        })
    })

    app.delete('/:id', DeleteMcpRequest, async (req, reply) => {
        const mcpId = req.params.id
        const projectId = getProjectIdFromRequest(req)

        if (!projectId) {
            return reply.status(StatusCodes.BAD_REQUEST).send()
        }

        await mcpService(req.log).delete({
            mcpId,
            projectId,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
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
        body: CreateMcpRequestBody,
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
        body: UpdateMcpRequestBody,
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

const GetMcpRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.READ_MCP],
    },
    schema: {
        tags: ['mcp'],
        description: 'Get an MCP server by ID',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: McpWithPieces,
        },
    },
}

const DeleteMcpRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
        permissions: [Permission.WRITE_MCP],
    },
    schema: {
        tags: ['mcp'],
        description: 'Delete an MCP server by ID',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: Type.Object({
            projectId: Type.Optional(Type.String({})),
        }),
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Never(),
        },
    },
}
