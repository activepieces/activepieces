import { PlatformId, UserId } from '@activepieces/core-utils'
import { ApplicationEventName } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { applicationEvents } from '../helper/application-events'

export const platformSideEffects = (log: FastifyBaseLogger) => ({
    onAuditLogRetentionUpdated({ platformId, userId, ip, previousRetentionDays, retentionDays, instanceLimitDays }: OnAuditLogRetentionUpdatedParams): void {
        applicationEvents(log).sendUserEvent({ platformId, userId, ip }, {
            action: ApplicationEventName.AUDIT_LOG_RETENTION_UPDATED,
            data: {
                previousRetentionDays,
                retentionDays,
                instanceLimitDays,
            },
        })
    },
})

type OnAuditLogRetentionUpdatedParams = {
    platformId: PlatformId
    userId?: UserId
    ip?: string
    previousRetentionDays: number | null
    retentionDays: number | null
    instanceLimitDays: number | null
}
