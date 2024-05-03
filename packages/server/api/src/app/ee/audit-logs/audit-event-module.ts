import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustBeOwnedByCurrentUser, platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { auditLogService } from './audit-event-service'
import { ListAuditEventsRequest } from '@activepieces/ee-shared'
import {
    assertNotNullOrUndefined,
} from '@activepieces/shared'

export const auditEventModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.auditLogEnabled))
    app.addHook('preHandler', platformMustBeOwnedByCurrentUser)
    await app.register(auditEventController, { prefix: '/v1/audit-events' })
}

const auditEventController: FastifyPluginAsyncTypebox = async (app) => {
    app.get(
        '/',
        {
            schema: {
                querystring: ListAuditEventsRequest,
            },
        },
        async (request) => {
            const platformId = request.principal.platform.id
            assertNotNullOrUndefined(platformId, 'platformId')
            return auditLogService.list({
                platformId,
                cursorRequest: request.query.cursor ?? null,
                limit: request.query.limit ?? 20,
            })
        },
    )
}
