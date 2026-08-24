import { SeekPage } from '@activepieces/core-utils'
import {
    ListMcpOAuthClientsRequestQuery,
    McpOAuthClientRow,
    PrincipalType,
    RevokeMcpOAuthClientsRequestBody,
} from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
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
