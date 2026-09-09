import { SeekPage } from '@activepieces/core-utils'
import {
    ListMcpOAuthGrantsRequestQuery,
    McpOAuthGrant,
    PrincipalType,
    RevokeMcpOAuthGrantsRequestBody,
} from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { userService } from '../../../user/user-service'
import { mcpOAuthTokenService } from './mcp-oauth-token.service'

export const mcpOAuthGrantsController: FastifyPluginAsyncZod = async (app) => {

    app.get('/v1/mcp-oauth/grants', ListGrantsRequest, async (req): Promise<SeekPage<McpOAuthGrant>> => {
        return mcpOAuthTokenService.listGrants({
            platformId: req.principal.platform.id,
            userId: await resolveUserIdFilter(req),
            projectIds: req.query.projectIds,
            memberIds: req.query.memberIds,
            clientKeys: req.query.clientKeys,
            cursor: req.query.cursor,
            limit: req.query.limit,
        })
    })

    app.post('/v1/mcp-oauth/grants/revoke', RevokeGrantsRequest, async (req, reply) => {
        await mcpOAuthTokenService.revokeGrants({
            ids: req.body.ids,
            platformId: req.principal.platform.id,
            userId: await resolveUserIdFilter(req),
        })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

async function resolveUserIdFilter(req: FastifyRequest): Promise<string | null> {
    const user = await userService(req.log).getOneOrFail({ id: req.principal.id })
    return userService(req.log).isUserPrivileged(user) ? null : req.principal.id
}

const ListGrantsRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        tags: ['mcp-oauth'],
        querystring: ListMcpOAuthGrantsRequestQuery,
        response: {
            [StatusCodes.OK]: SeekPage(McpOAuthGrant),
        },
    },
}

const RevokeGrantsRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        tags: ['mcp-oauth'],
        body: RevokeMcpOAuthGrantsRequestBody,
        response: {
            [StatusCodes.NO_CONTENT]: z.never(),
        },
    },
}
