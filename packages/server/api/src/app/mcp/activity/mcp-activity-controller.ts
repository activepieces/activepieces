import { SeekPage } from '@activepieces/core-utils'
import {
    GetMcpActivityPayloadParams,
    ListMcpActivityRequestQuery,
    McpActivityPayload,
    PopulatedMcpActivity,
    PrincipalType,
} from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { mcpListingUtils } from '../mcp-listing-utils'
import { mcpActivityService } from './mcp-activity-service'

export const mcpActivityController: FastifyPluginAsyncZod = async (app) => {

    app.get('/v1/mcp-activity', ListActivityRequest, async (req): Promise<SeekPage<PopulatedMcpActivity>> => {
        return mcpActivityService(req.log).list({
            platformId: req.principal.platform.id,
            userId: await mcpListingUtils.resolveUserIdFilter(req),
            projectIds: req.query.projectIds,
            memberIds: req.query.memberIds,
            clientKeys: req.query.clientKeys,
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
            userId: await mcpListingUtils.resolveUserIdFilter(req),
        })
    })
}

const ListActivityRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        tags: ['mcp-activity'],
        querystring: ListMcpActivityRequestQuery,
        response: {
            [StatusCodes.OK]: SeekPage(PopulatedMcpActivity),
        },
    },
}

const GetPayloadRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        tags: ['mcp-activity'],
        params: GetMcpActivityPayloadParams,
        response: {
            [StatusCodes.OK]: McpActivityPayload,
        },
    },
}
