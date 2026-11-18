import { PlatformId, UserId } from '@activepieces/core-utils'
import { ApplicationEventName } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { applicationEvents } from '../helper/application-events'
import { AuthenticationAuditEventParams } from './authentication-audit-events'

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
    onAuthenticationSettingsChanged({ platformId, userId, ip, events }: OnAuthenticationSettingsChangedParams): void {
        for (const event of events) {
            applicationEvents(log).sendUserEvent({ platformId, userId, ip }, event)
        }
    },
    onSsoDomainExpired({ platformId, domain }: OnSsoDomainExpiredParams): void {
        applicationEvents(log).sendUserEvent({ platformId }, {
            action: ApplicationEventName.SSO_DOMAIN_EXPIRED,
            data: { domain },
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

type OnAuthenticationSettingsChangedParams = {
    platformId: PlatformId
    userId?: UserId
    ip?: string
    events: AuthenticationAuditEventParams[]
}

type OnSsoDomainExpiredParams = {
    platformId: PlatformId
    domain: string
}
