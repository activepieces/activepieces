import { ListAuditEventsRequest, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { auditLogService } from './audit-event-service'

export const auditEventModule: FastifyPluginAsyncZod = async (app) => {
    auditLogService(app.log).setup()
    app.addHook('preHandler', platformMustHaveFeatureEnabled((platform) => platform.plan.auditLogEnabled))
    await app.register(auditEventController, { prefix: '/v1/audit-events' })
}

const auditEventController: FastifyPluginAsyncZod = async (app) => {

    app.get('/', ListAuditEventsRequestEndpoint, async (request) => {
        return auditLogService(request.log).list({
            platformId: request.principal.platform.id,
            cursorRequest: request.query.cursor ?? null,
            limit: request.query.limit ?? 20,
            action: request.query.action ?? undefined,
            projectId: request.query.projectId ?? undefined,
            userId: request.query.userId ?? undefined,
            createdBefore: request.query.createdBefore ?? undefined,
            createdAfter: request.query.createdAfter ?? undefined,
        })
    })
}


const ListAuditEventsRequestEndpoint = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.SERVICE, PrincipalType.USER]),
    },
    schema: {
        querystring: ListAuditEventsRequest,
    },
}
