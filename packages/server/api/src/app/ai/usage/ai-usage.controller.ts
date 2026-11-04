import { AiUsageDetail, AiUsageDetailParams, AiUsageItemList, AiUsageItemsQuery, AiUsageOverview, AiUsageQuery, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { RateLimitOptions } from '@fastify/rate-limit'
import { FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { aiProviderService } from '../ai-provider-service'
import { aiUsageReadService } from './ai-usage-read.service'

export const aiUsageController: FastifyPluginAsyncZod = async (app) => {
    app.get('/overview', GetOverview, async (request) => {
        return aiUsageReadService(request.log).overview({ platformId: request.principal.platform.id, ...request.query })
    })
    app.get('/items', ListItems, async (request) => {
        return aiUsageReadService(request.log).items({ platformId: request.principal.platform.id, ...request.query })
    })
    app.get('/items/:dimension/:id', GetDetail, async (request) => {
        return aiUsageReadService(request.log).detail({ platformId: request.principal.platform.id, ...request.query, ...request.params })
    })
}

function assertPlan(request: FastifyRequest): Promise<void> {
    return aiProviderService(request.log).assertAiProvidersPlan(request.principal.platform.id)
}

const RATE_LIMIT: RateLimitOptions = {
    max: 60,
    timeWindow: '1 minute',
    hook: 'preHandler',
    keyGenerator: (request) => `ai-usage:${request.principal.id}`,
}

const READ_CONFIG = {
    security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    rateLimit: RATE_LIMIT,
}

const GetOverview = {
    config: READ_CONFIG,
    preHandler: assertPlan,
    schema: {
        tags: ['ai-usage'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'AI spend and calls for a period, with totals, trend and top items.',
        querystring: AiUsageQuery,
        response: { [StatusCodes.OK]: AiUsageOverview },
    },
}

const ListItems = {
    config: READ_CONFIG,
    preHandler: assertPlan,
    schema: {
        tags: ['ai-usage'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'AI spend broken down by project, flow, agent, user, key or model.',
        querystring: AiUsageItemsQuery,
        response: { [StatusCodes.OK]: AiUsageItemList },
    },
}

const GetDetail = {
    config: READ_CONFIG,
    preHandler: assertPlan,
    schema: {
        tags: ['ai-usage'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        description: 'AI spend for one project, flow, agent, user, key or model.',
        params: AiUsageDetailParams,
        querystring: AiUsageQuery,
        response: { [StatusCodes.OK]: AiUsageDetail },
    },
}
