import { ListAuditEventsRequest, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { platformMustHaveFeatureEnabled } from '../authentication/ee-authorization'
import { auditLogService } from './audit-event-service'
import { auditLogRetention } from './audit-log-retention'

export const auditEventModule: FastifyPluginAsyncZod = async (app) => {
    auditLogService(app.log).setup()
    systemJobHandlers.registerJobHandler(SystemJobName.AUDIT_LOG_RETENTION, async () => {
        await auditLogRetention(app.log).sweep()
    })
    await systemJobsSchedule(app.log).upsertJob({
        job: {
            name: SystemJobName.AUDIT_LOG_RETENTION,
            data: {},
            jobId: SystemJobName.AUDIT_LOG_RETENTION,
        },
        schedule: {
            type: 'repeated',
            cron: '15 * * * *',
        },
    })
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
