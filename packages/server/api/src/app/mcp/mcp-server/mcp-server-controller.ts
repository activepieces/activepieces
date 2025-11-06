import { apId, ApId, CreateMcpRequestBody, DeleteMcpRequestParams, GetMcpRequestParams, isNil, ListMcpsRequest, McpWithTools, Nullable, Permission, PlatformUsageMetric, PrincipalType, ProjectId, RotateTokenRequestParams, SeekPage, SERVICE_KEY_SECURITY_OPENAPI, UpdateMcpRequestBody, UpdateMcpRequestParams } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { AuthorizationType, ProjectAuthorization, RouteKind } from '@activepieces/server-shared'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { PlatformPlanHelper } from '../../ee/platform/platform-plan/platform-plan-helper'
import { mcpService } from '../mcp-service'
import { FastifyBaseLogger, FastifyRequest, RawServerDefault, RouteShorthandOptions } from 'fastify'
import { IncomingMessage, ServerResponse } from 'http'
import { ProjectAuthRouteOptions } from 'packages/server/api/types/fastify'

const DEFAULT_PAGE_SIZE = 10


export const mcpServerController: FastifyPluginAsyncTypebox = async (app) => {

    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    app.post('/', CreateMcpRequest, async (req) => {
        await PlatformPlanHelper.checkQuotaOrThrow({
            platformId: req.principal.platform.id,
            projectId: req.principal.projectId,
            metric: PlatformUsageMetric.MCPS,
        })
        const projectId = req.body.projectId
        return mcpService(req.log).create({
            projectId,
            name: req.body.name,
        })
    })
    
    app.get('/', GetMcpsRequest, async (req) => {
        const projectId = req.query.projectId
        
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
            projectId: req.principal.projectId,
        })
    })

    app.post('/:id', UpdateMcpRequest, async (req) => {
        const mcpId = req.params.id
        const { name, tools } = req.body
        await PlatformPlanHelper.checkResourceLocked({ platformId: req.principal.platform.id, resource: PlatformUsageMetric.MCPS })
        return mcpService(req.log).update({
            mcpId,
            name,
            tools,
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
        await mcpService(req.log).delete({
            mcpId,
            projectId: req.principal.projectId,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

const CreateMcpRequest: ProjectAuthRouteOptions<{ Body: CreateMcpRequestBody }> = {
    config: {
        security: {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.PROJECT,
                allowedPrincipals: [PrincipalType.USER],
                project: {
                    projectId: async (request) => {
                        return request.body.projectId
                    },
                    permission: Permission.WRITE_MCP,
                },
            },
        },
    },
    schema: {
        tags: ['mcp'],
        description: 'Create a new MCP server',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        response: {
            [StatusCodes.OK]: Nullable(McpWithTools),
        },
    },
}

const GetMcpsRequest = {
    config: {
        security: {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.PROJECT,
                allowedPrincipals: [PrincipalType.USER],
                project: {
                    projectId: async (request: FastifyRequest<{ Querystring: ListMcpsRequest }>) => {
                        return request.query.projectId
                    },
                    permission: Permission.READ_MCP,
                },
            },
        },
    },
    schema: {
        tags: ['mcp'],
        description: 'List MCP servers',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        querystring: ListMcpsRequest,
        response: {
            [StatusCodes.OK]: SeekPage(McpWithTools),
        },
    },
}

export const UpdateMcpRequest = {
    config: {
        security: {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.PROJECT,
                allowedPrincipals: [PrincipalType.USER],
                project: {
                    projectId: async (request: FastifyRequest<{ Params: UpdateMcpRequestParams }>) => {
                        return await getProjectIdFromMcpId(request.params.id, request.log)
                    },
                    permission: Permission.WRITE_MCP,
                },
            },
        },
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
            [StatusCodes.OK]: McpWithTools,
        },
    },
}

const RotateTokenRequest = {
    config: {
        security: {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.PROJECT,
                allowedPrincipals: [PrincipalType.USER],
                project: {
                    projectId: async (request: FastifyRequest<{ Params: RotateTokenRequestParams }>) => {
                        return await getProjectIdFromMcpId(request.params.id, request.log)
                    },
                    permission: Permission.WRITE_MCP,
                },
            },
        },
    },
    schema: {
        tags: ['mcp'],
        description: 'Rotate the MCP token',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: RotateTokenRequestParams,
        response: {
            [StatusCodes.OK]: McpWithTools,
        },
    },
}

const GetMcpRequest = {
    config: {
        security: {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.PROJECT,
                allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE],
                project: {
                    projectId: async (request: FastifyRequest<{ Params: GetMcpRequestParams }>) => {
                        return await getProjectIdFromMcpId(request.params.id, request.log)
                    },
                    permission: Permission.READ_MCP,
                },
            },
        },
    },
    schema: {
        tags: ['mcp'],
        description: 'Get an MCP server by ID',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: McpWithTools,
        },
    },
}

const DeleteMcpRequest = {
    config: {
        security: {
            kind: RouteKind.AUTHENTICATED,
            authorization: {
                type: AuthorizationType.PROJECT,
                allowedPrincipals: [PrincipalType.USER],
                project: {
                    projectId: async (request: FastifyRequest<{ Params: DeleteMcpRequestParams }>) => {
                        return await getProjectIdFromMcpId(request.params.id, request.log)
                    },
                    permission: Permission.WRITE_MCP,
                },
            },
        },
    },
    schema: {
        tags: ['mcp'],
        description: 'Delete an MCP server by ID',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Never(),
        },
    },
}

async function getProjectIdFromMcpId(mcpId: ApId, log: FastifyBaseLogger): Promise<ProjectId | null> {
    const mcp = await mcpService(log).getOneById({
        id: mcpId,
    })
    return mcp?.projectId ?? null
}