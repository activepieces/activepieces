import { ApId, Permission } from '@activepieces/core-utils'
import { PopulatedMcpServer, PrincipalType, ProjectMcpServerResponse, SERVICE_KEY_SECURITY_OPENAPI, UpdateMcpServerRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../core/security/authorization/common'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { mcpServerService } from './mcp-service'
import { mcpOAuthTokenService } from './oauth/token/mcp-oauth-token.service'

export const mcpServerController: FastifyPluginAsyncZod = async (app) => {

    app.get('/', GetMcpRequest, async (req) => {
        return withPlatformDisabledTools({
            platformId: req.principal.platform.id,
            mcp: await mcpServerService(req.log).getPopulatedByProjectId(req.projectId),
            log: req.log,
        })
    })

    app.post('/', UpdateMcpRequest, async (req) => {
        const { disabledTools } = req.body
        return withPlatformDisabledTools({
            platformId: req.principal.platform.id,
            mcp: await mcpServerService(req.log).update({
                projectId: req.projectId,
                disabledTools,
            }),
            log: req.log,
        })
    })

    app.post('/rotate', RotateTokenRequest, async (req) => {
        return withPlatformDisabledTools({
            platformId: req.principal.platform.id,
            mcp: await mcpServerService(req.log).rotateToken({
                projectId: req.projectId,
            }),
            log: req.log,
        })
    })

    app.post('/token', GenerateMcpTokenRequest, async (req) => {
        const mcpToken = await mcpOAuthTokenService.issueInternalAccessToken({
            userId: req.principal.id,
            platformId: req.principal.platform.id,
            projectId: req.projectId,
        })
        const frontendUrl = system.getOrThrow(AppSystemProp.FRONTEND_URL)
        return {
            mcpServerUrl: `${frontendUrl}/mcp`,
            mcpToken,
        }
    })
}

async function withPlatformDisabledTools({ platformId, mcp, log }: {
    platformId: string
    mcp: PopulatedMcpServer
    log: FastifyBaseLogger
}): Promise<ProjectMcpServerResponse> {
    const platformDisabledTools = await mcpServerService(log).listPlatformDisabledTools({ platformId })
    return { ...mcp, platformDisabledTools }
}

export const UpdateMcpRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER],
            Permission.WRITE_MCP,
            {
                type: ProjectResourceType.PARAM,
            },
        ),
    },
    schema: {
        tags: ['mcp'],
        description: 'Update the project MCP server configuration',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: z.object({
            projectId: ApId,
        }),
        body: UpdateMcpServerRequest,
    },
}

const GetMcpRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER],
            Permission.READ_MCP,
            {
                type: ProjectResourceType.PARAM,
            },
        ),
    },
    schema: {
        tags: ['mcp'],
        description: 'Get an MCP server by ID',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: z.object({
            projectId: ApId,
        }),
    },
}

const RotateTokenRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER],
            Permission.WRITE_MCP,
            {
                type: ProjectResourceType.PARAM,
            },
        ),
    },
    schema: {
        tags: ['mcp'],
        description: 'Rotate the MCP server token',
    },
    params: z.object({
        projectId: ApId,
    }),
}

const GenerateMcpTokenResponse = z.object({
    mcpServerUrl: z.string(),
    mcpToken: z.string(),
})

const GenerateMcpTokenRequest = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER],
            Permission.READ_MCP,
            {
                type: ProjectResourceType.PARAM,
            },
        ),
    },
    schema: {
        tags: ['mcp'],
        description: 'Generate a short-lived MCP access token and server URL for the project',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        params: z.object({
            projectId: ApId,
        }),
        response: {
            [StatusCodes.OK]: GenerateMcpTokenResponse,
        },
    },
}
