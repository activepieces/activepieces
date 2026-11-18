import { afterEach, describe, expect, it } from 'vitest'
import { auditLogRetentionCeiling } from '../../../../src/app/helper/retention/audit-log-retention-ceiling'

afterEach(() => {
    delete process.env.AP_AUDIT_LOG_RETENTION_DAYS
})

describe('auditLogRetentionCeiling', () => {
    it('keeps audit events forever when the variable is not set', () => {
        expect(auditLogRetentionCeiling.get()).toBeNull()
    })

    it.each(['', '0', '1', '29', '-5', '1e3', '1,000', '1_000', '30.5', ' 30', 'abc', '3651'])('ignores the malformed or out-of-range value %j instead of reading a smaller number', (value) => {
        process.env.AP_AUDIT_LOG_RETENTION_DAYS = value

        expect(auditLogRetentionCeiling.get()).toBeNull()
    })

    it.each([['30', 30], ['365', 365], ['3650', 3650]])('reads the whole number of days %j', (value, days) => {
        process.env.AP_AUDIT_LOG_RETENTION_DAYS = value

        expect(auditLogRetentionCeiling.get()).toBe(days)
    })
})
