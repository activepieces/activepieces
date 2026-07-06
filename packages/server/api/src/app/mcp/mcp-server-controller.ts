import { ApId, Permission } from '@activepieces/core-utils'
import { PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpdateMcpServerRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../core/security/authorization/common'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { domainHelper } from '../helper/domain-helper'
import { mcpServerService } from './mcp-service'
import { mcpOAuthTokenService } from './oauth/token/mcp-oauth-token.service'

export const mcpServerController: FastifyPluginAsyncZod = async (app) => {

    app.get('/', GetMcpRequest, async (req) => {
        return mcpServerService(req.log).getPopulatedByProjectId(req.projectId)
    })

    app.post('/', UpdateMcpRequest, async (req) => {
        const { disabledTools } = req.body
        return mcpServerService(req.log).update({
            projectId: req.projectId,
            disabledTools,
        })
    })

    app.post('/rotate', RotateTokenRequest, async (req) => {
        return mcpServerService(req.log).rotateToken({
            projectId: req.projectId,
        })
    })

    app.post('/token', GenerateMcpTokenRequest, async (req) => {
        const mcpToken = await mcpOAuthTokenService.issueInternalAccessToken({
            userId: req.principal.id,
            platformId: req.principal.platform.id,
            projectId: req.projectId,
        })
        return {
            mcpServerUrl: await domainHelper.getMcpUrl({ path: 'mcp' }),
            mcpToken,
        }
    })
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
