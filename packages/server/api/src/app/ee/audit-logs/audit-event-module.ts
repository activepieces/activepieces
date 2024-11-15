import { ListAuditEventsRequest } from '@activepieces/ee-shared'
import {
    EndpointScope,
    PrincipalType,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { platformMustBeOwnedByCurrentUser, platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { auditLogService } from './audit-event-service'

export const auditEventModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.auditLogEnabled))
    app.addHook('preHandler', platformMustBeOwnedByCurrentUser)
    await app.register(auditEventController, { prefix: '/v1/audit-events' })
}

const auditEventController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/', ListAuditEventsRequestEndpoint, async (request) => {
        return auditLogService.list({
            platformId: request.principal.platform.id,
            cursorRequest: request.query.cursor ?? null,
            limit: request.query.limit ?? 20,
            action: request.query.action ?? undefined,
            projectId: request.query.projectId ?? undefined,
            userId: request.query.userId ?? undefined,
        })
    })
}


const ListAuditEventsRequestEndpoint = {
    schema: {
        querystring: ListAuditEventsRequest,
        allowedPrincipals: [PrincipalType.UNKNOWN],
        scope: EndpointScope.PLATFORM,
    },
}