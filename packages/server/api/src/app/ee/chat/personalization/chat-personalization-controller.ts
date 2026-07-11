import { PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpsertChatPersonalizationRequest } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { chatPersonalizationService } from './chat-personalization-service'

const PERSONALIZATION_PRINCIPALS = [PrincipalType.USER] as const

export const chatPersonalizationController: FastifyPluginAsyncZod = async (app) => {

    // 202-style: the research job is queued; the current view rides along and
    // the frontend follows progress over the websocket / GET polling.
    app.post('/', UpsertPersonalizationRoute, async (request, reply) => {
        const view = await chatPersonalizationService(request.log).upsert({
            platformId: request.principal.platform.id,
            userId: request.principal.id,
            website: request.body.website ?? null,
            role: request.body.role ?? null,
            personalize: request.body.personalize,
        })
        return reply.status(StatusCodes.ACCEPTED).send(view)
    })

    app.get('/', GetPersonalizationRoute, async (request) => {
        return chatPersonalizationService(request.log).getEffectiveView({
            platformId: request.principal.platform.id,
            userId: request.principal.id,
        })
    })

}

const UpsertPersonalizationRoute = {
    config: {
        security: securityAccess.publicPlatform(PERSONALIZATION_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
        body: UpsertChatPersonalizationRequest,
    },
}

const GetPersonalizationRoute = {
    config: {
        security: securityAccess.publicPlatform(PERSONALIZATION_PRINCIPALS),
    },
    schema: {
        tags: ['chat'],
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}
