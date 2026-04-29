import { ApId, Permission, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpdateMcpServerRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ProjectResourceType } from '../core/security/authorization/common'
import { securityAccess } from '../core/security/authorization/fastify-security'
import { mcpServerService } from './mcp-service'

export const mcpServerController: FastifyPluginAsyncZod = async (app) => {

    app.get('/', GetMcpRequest, async (req) => {
        return mcpServerService(req.log).getPopulatedByProjectId(req.projectId)
    })

    app.post('/', UpdateMcpRequest, async (req) => {
        const { status, enabledTools } = req.body as UpdateMcpServerRequest
        return mcpServerService(req.log).update({
            projectId: req.projectId,
            status,
            enabledTools,
        })
    })

    app.post('/rotate', RotateTokenRequest, async (req) => {
        return mcpServerService(req.log).rotateToken({
            projectId: req.projectId,
        })
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
