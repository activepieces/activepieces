import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { McpReachResponse, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpdateMcpServerRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { userIdentityHelper } from '../helper/user-identity-helper'
import { mcpAccess } from './mcp-access'
import { mcpServerService } from './mcp-service'

export const mcpPlatformController: FastifyPluginAsyncZod = async (app) => {

    app.get('/', GetPlatformMcpRoute, async (req) => {
        return mcpServerService(req.log).getByPlatformId(req.principal.platform.id)
    })

    app.get('/reach', GetMcpReachRoute, async (req) => {
        const userId = req.principal.id
        if (await userIdentityHelper(req.log).isUserEmbedded(userId)) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: { message: 'Embedded users cannot list MCP reach across projects' },
            })
        }
        return mcpAccess.resolveReach({
            platformId: req.principal.platform.id,
            userId,
            log: req.log,
        })
    })

    app.post('/', UpdatePlatformMcpRoute, async (req) => {
        const { disabledTools } = req.body
        return mcpServerService(req.log).updatePlatform({
            platformId: req.principal.platform.id,
            disabledTools,
        })
    })

    app.post('/rotate', RotatePlatformTokenRoute, async (req) => {
        return mcpServerService(req.log).rotatePlatformToken({
            platformId: req.principal.platform.id,
        })
    })
}

const GetPlatformMcpRoute = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        tags: ['mcp'],
        description: 'Get the platform MCP server configuration',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}

const GetMcpReachRoute = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        tags: ['mcp'],
        description: 'List the projects where the caller may use MCP',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        response: {
            [StatusCodes.OK]: McpReachResponse,
        },
    },
}

const UpdatePlatformMcpRoute = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        tags: ['mcp'],
        description: 'Update the platform MCP server configuration',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: UpdateMcpServerRequest,
    },
}

const RotatePlatformTokenRoute = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        tags: ['mcp'],
        description: 'Rotate the platform MCP server token',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}
