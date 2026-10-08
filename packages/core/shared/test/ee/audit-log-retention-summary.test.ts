import { describe, expect, it } from 'vitest'
import { ApplicationEventName, AuditLogRetentionUpdatedEvent, buildMockEvent, summarizeApplicationEvent } from '../../src/index'

function retentionEvent(data: AuditLogRetentionUpdatedEvent['data']): AuditLogRetentionUpdatedEvent {
    const mock = AuditLogRetentionUpdatedEvent.parse(buildMockEvent({ event: ApplicationEventName.AUDIT_LOG_RETENTION_UPDATED, platformId: 'platform-id' }))
    return { ...mock, data }
}

describe('summarizeApplicationEvent for audit.log.retention.updated', () => {
    it.each([
        { data: { previousRetentionDays: 180, retentionDays: 365, instanceLimitDays: null }, expected: 'Audit log retention changed from 6 months to 1 year' },
        { data: { previousRetentionDays: null, retentionDays: 30, instanceLimitDays: null }, expected: 'Audit log retention changed from forever to 30 days' },
        { data: { previousRetentionDays: 90, retentionDays: null, instanceLimitDays: 365 }, expected: 'Audit log retention changed from 90 days to the instance limit (1 year)' },
    ])('describes $data as "$expected"', ({ data, expected }) => {
        expect(summarizeApplicationEvent(retentionEvent(data))).toBe(expected)
    })
})
