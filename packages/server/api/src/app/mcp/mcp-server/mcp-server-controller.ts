import { apId, ApId, CreateMcpRequestBody, DeleteMcpRequestParams, GetMcpRequestParams, ListMcpsRequest, McpWithTools, Nullable, Permission, PlatformUsageMetric, PrincipalType, ProjectId, RotateTokenRequestParams, SeekPage, SERVICE_KEY_SECURITY_OPENAPI, UpdateMcpRequestBody, UpdateMcpRequestParams } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { AuthorizationType, RouteKind } from '@activepieces/server-shared'
import { StatusCodes } from 'http-status-codes'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { PlatformPlanHelper } from '../../ee/platform/platform-plan/platform-plan-helper'
import { mcpService } from '../mcp-service'
import { FastifyBaseLogger } from 'fastify'
import { projectMustBeAccessibleByCurrentUser } from '../../ee/helper/project-authorization'

const DEFAULT_PAGE_SIZE = 10

export const mcpServerController: FastifyPluginAsyncTypebox = async (app) => {

    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    app.post('/', {
        config: {
            security: {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.PROJECT,
                    allowedPrincipals: [PrincipalType.USER],
                    permission: Permission.WRITE_MCP,
                }
            },
        },
        preHandler: async (req) => {
            req.principal.projectId = req.body.projectId
            await projectMustBeAccessibleByCurrentUser(req.principal.projectId, req.principal.id, req.log)
        },
        schema: {
            tags: ['mcp'],
            description: 'Create a new MCP server',
            security: [SERVICE_KEY_SECURITY_OPENAPI],
            body: CreateMcpRequestBody,
            response: {
                [StatusCodes.OK]: Nullable(McpWithTools),
            },
        },
    }, async (req) => {
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
    
    app.get('/', {
        config: {
            security: {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.PROJECT,
                    allowedPrincipals: [PrincipalType.USER],
                    permission: Permission.READ_MCP,
                },
            },
        },
        preHandler: async (req) => {
            req.principal.projectId = req.query.projectId
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
    }, async (req) => {
        const projectId = req.query.projectId
        
        const result = await mcpService(req.log).list({
            projectId,
            cursorRequest: req.query.cursor ?? null,
            limit: req.query.limit ?? DEFAULT_PAGE_SIZE,
            name: req.query.name ?? undefined,
        })
        
        return result
    })

    app.get('/:id', {
        config: {
            security: {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.PROJECT,
                    allowedPrincipals: [PrincipalType.USER, PrincipalType.ENGINE],
                    permission: Permission.READ_MCP,
                },
            },
        },
        preHandler: async (req) => {
            req.principal.projectId = await getProjectIdFromMcpId(req.params.id, req.log)
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
    }, async (req) => {
        const mcpId = req.params.id
        return mcpService(req.log).getOrThrow({
            mcpId,
            projectId: req.principal.projectId,
        })
    })

    app.post('/:id', {
        config: {
            security: {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.PROJECT,
                    allowedPrincipals: [PrincipalType.USER],
                    permission: Permission.WRITE_MCP,
                },
            },
        },
        preHandler: async (req) => {
            req.principal.projectId = await getProjectIdFromMcpId(req.params.id, req.log)
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
    }, async (req) => {
        const mcpId = req.params.id
        const { name, tools } = req.body
        await PlatformPlanHelper.checkResourceLocked({ platformId: req.principal.platform.id, resource: PlatformUsageMetric.MCPS })
        return mcpService(req.log).update({
            mcpId,
            name,
            tools,
        })
    })

    app.post('/:id/rotate', {
        config: {
            security: {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.PROJECT,
                    allowedPrincipals: [PrincipalType.USER],
                    permission: Permission.WRITE_MCP,
                },
            },
        },
        preHandler: async (req) => {
            req.principal.projectId = await getProjectIdFromMcpId(req.params.id, req.log)
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
    }, async (req) => {
        const mcpId = req.params.id
        return mcpService(req.log).update({
            mcpId,
            token: apId(),
        })
    })

    app.delete('/:id', {
        config: {
            security: {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.PROJECT,
                    allowedPrincipals: [PrincipalType.USER],
                    permission: Permission.WRITE_MCP,
                },
            },
        },
        preHandler: async (req) => {
            req.principal.projectId = await getProjectIdFromMcpId(req.params.id, req.log)
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
    }, async (req, reply) => {
        const mcpId = req.params.id
        await mcpService(req.log).delete({
            mcpId,
            projectId: req.principal.projectId,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

async function getProjectIdFromMcpId(mcpId: ApId, log: FastifyBaseLogger): Promise<ProjectId | null> {
    const mcp = await mcpService(log).getOneById({
        id: mcpId,
    })
    return mcp?.projectId ?? null
}