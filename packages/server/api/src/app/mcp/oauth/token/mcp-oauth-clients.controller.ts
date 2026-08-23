import { Permission, SeekPage } from '@activepieces/core-utils'
import {
    ListMcpOAuthClientsRequestQuery,
    ListProjectMcpOAuthClientsRequestQuery,
    McpOAuthClientRow,
    PrincipalType,
    RevokeMcpOAuthClientsRequestBody,
    RevokeProjectMcpOAuthClientsRequestBody,
} from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { ProjectResourceType } from '../../../core/security/authorization/common'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { mcpOAuthTokenService } from './mcp-oauth-token.service'

export const mcpOAuthClientsController: FastifyPluginAsyncZod = async (app) => {

    app.get('/v1/mcp-oauth/clients/me', ListMyClientsRequest, async (req): Promise<SeekPage<McpOAuthClientRow>> => {
        return mcpOAuthTokenService.listForUser({
            userId: req.principal.id,
            platformId: req.principal.platform.id,
            cursor: req.query.cursor,
            limit: req.query.limit,
        })
    })

    app.post('/v1/mcp-oauth/clients/me/revoke', RevokeMyClientsRequest, async (req, reply) => {
        await mcpOAuthTokenService.revokeForUser({
            ids: req.body.ids,
            userId: req.principal.id,
            platformId: req.principal.platform.id,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })

    app.get('/v1/mcp-oauth/clients', ListProjectClientsRequest, async (req): Promise<SeekPage<McpOAuthClientRow>> => {
        return mcpOAuthTokenService.listForProject({
            projectId: req.query.projectId,
            cursor: req.query.cursor,
            limit: req.query.limit,
        })
    })

    app.post('/v1/mcp-oauth/clients/revoke', RevokeProjectClientsRequest, async (req, reply) => {
        await mcpOAuthTokenService.revokeForProject({
            ids: req.body.ids,
            projectId: req.body.projectId,
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

const ListMyClientsRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        tags: ['mcp-oauth'],
        querystring: ListMcpOAuthClientsRequestQuery,
    },
}

const RevokeMyClientsRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        tags: ['mcp-oauth'],
        body: RevokeMcpOAuthClientsRequestBody,
    },
}

const ListProjectClientsRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER], Permission.WRITE_MCP, { type: ProjectResourceType.QUERY }),
    },
    schema: {
        tags: ['mcp-oauth'],
        querystring: ListProjectMcpOAuthClientsRequestQuery,
    },
}

const RevokeProjectClientsRequest = {
    config: {
        security: securityAccess.project([PrincipalType.USER], Permission.WRITE_MCP, { type: ProjectResourceType.BODY }),
    },
    schema: {
        tags: ['mcp-oauth'],
        body: RevokeProjectMcpOAuthClientsRequestBody,
    },
}
