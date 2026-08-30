import {
    GetMcpActivityPayloadParams,
    ListMcpActivityRequestQuery,
    ListMcpActivityResponse,
    McpActivityPayload,
    PrincipalType,
} from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { userService } from '../../user/user-service'
import { mcpActivityService } from './mcp-activity.service'

export const mcpActivityController: FastifyPluginAsyncZod = async (app) => {

    app.get('/v1/mcp-activity', ListActivityRequest, async (req): Promise<ListMcpActivityResponse> => {
        return mcpActivityService(req.log).list({
            platformId: req.principal.platform.id,
            userId: await resolveUserIdFilter(req),
            projectIds: req.query.projectIds,
            memberIds: req.query.memberIds,
            statuses: req.query.statuses,
            createdAfter: req.query.createdAfter,
            createdBefore: req.query.createdBefore,
            cursor: req.query.cursor,
            limit: req.query.limit,
        })
    })

    app.get('/v1/mcp-activity/:id/payload', GetPayloadRequest, async (req): Promise<McpActivityPayload> => {
        return mcpActivityService(req.log).getPayload({
            id: req.params.id,
            platformId: req.principal.platform.id,
            userId: await resolveUserIdFilter(req),
        })
    })
}

async function resolveUserIdFilter(req: FastifyRequest): Promise<string | null> {
    const user = await userService(req.log).getOneOrFail({ id: req.principal.id })
    return userService(req.log).isUserPrivileged(user) ? null : req.principal.id
}

const ListActivityRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        tags: ['mcp-activity'],
        querystring: ListMcpActivityRequestQuery,
    },
}

const GetPayloadRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        tags: ['mcp-activity'],
        params: GetMcpActivityPayloadParams,
    },
}
