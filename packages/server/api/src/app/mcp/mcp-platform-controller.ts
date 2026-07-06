import { PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpdateMcpServerRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { mcpServerService } from './mcp-service'

export const mcpPlatformController: FastifyPluginAsyncZod = async (app) => {

    app.get('/', GetPlatformMcpRoute, async (req) => {
        return mcpServerService(req.log).getByPlatformId(req.principal.platform.id)
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
