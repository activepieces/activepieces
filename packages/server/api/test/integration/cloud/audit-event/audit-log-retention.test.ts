import { ApFlagId } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { In } from 'typeorm'
import { auditLogRepo } from '../../../../src/app/ee/audit-logs/audit-event-service'
import { auditLogRetention } from '../../../../src/app/ee/audit-logs/audit-log-retention'
import { db } from '../../../helpers/db'
import { createAuditEvent } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterEach(() => {
    delete process.env.AP_AUDIT_LOG_RETENTION_DAYS
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const daysAgo = (days: number): string => dayjs().subtract(days, 'days').toISOString()

const saveEvents = async ({ platformId, ages }: { platformId: string, ages: number[] }): Promise<string[]> => {
    const events = ages.map((age) => createAuditEvent({ platformId, created: daysAgo(age), updated: daysAgo(age) }))
    await db.save('audit_event', events)
    return events.map((event) => event.id)
}

const remainingIds = async (ids: string[]): Promise<string[]> => {
    const rows = await auditLogRepo().findBy({ id: In(ids) })
    return rows.map((row) => row.id).sort()
}

const createPlatform = async ({ auditLogRetentionDays }: { auditLogRetentionDays: number | null }) => {
    return createTestContext(app!, {
        platform: { auditLogRetentionDays },
        plan: { auditLogEnabled: true },
    })
}

describe('auditLogRetention.sweep', () => {
    it('deletes only the expired events of the platform that set a retention, and leaves other platforms alone', async () => {
        const withRetention = await createPlatform({ auditLogRetentionDays: 30 })
        const withoutRetention = await createPlatform({ auditLogRetentionDays: null })
        const [expired, fresh] = await Promise.all([
            saveEvents({ platformId: withRetention.platform.id, ages: [45, 400] }),
            saveEvents({ platformId: withRetention.platform.id, ages: [1, 29] }),
        ])
        const untouched = await saveEvents({ platformId: withoutRetention.platform.id, ages: [45, 400] })

        await auditLogRetention(app!.log).sweep()

        expect(await remainingIds([...expired, ...fresh, ...untouched])).toStrictEqual([...fresh, ...untouched].sort())
    })

    it('keeps every event when neither the platform nor the instance sets a retention', async () => {
        const ctx = await createPlatform({ auditLogRetentionDays: null })
        const ids = await saveEvents({ platformId: ctx.platform.id, ages: [100, 1000, 3000] })

        await auditLogRetention(app!.log).sweep()

        expect(await remainingIds(ids)).toStrictEqual([...ids].sort())
    })

    it('applies the instance ceiling to platforms without a value and to platforms with a longer value', async () => {
        process.env.AP_AUDIT_LOG_RETENTION_DAYS = '60'
        const inherits = await createPlatform({ auditLogRetentionDays: null })
        const longer = await createPlatform({ auditLogRetentionDays: 90 })
        const inheritsExpired = await saveEvents({ platformId: inherits.platform.id, ages: [61] })
        const inheritsFresh = await saveEvents({ platformId: inherits.platform.id, ages: [59] })
        const longerExpired = await saveEvents({ platformId: longer.platform.id, ages: [75] })
        const longerFresh = await saveEvents({ platformId: longer.platform.id, ages: [10] })

        await auditLogRetention(app!.log).sweep()

        expect(await remainingIds([...inheritsExpired, ...inheritsFresh, ...longerExpired, ...longerFresh]))
            .toStrictEqual([...inheritsFresh, ...longerFresh].sort())
    })

    it('ignores a malformed ceiling instead of deleting everything', async () => {
        process.env.AP_AUDIT_LOG_RETENTION_DAYS = '0'
        const ctx = await createPlatform({ auditLogRetentionDays: null })
        const ids = await saveEvents({ platformId: ctx.platform.id, ages: [1, 100] })

        await auditLogRetention(app!.log).sweep()

        expect(await remainingIds(ids)).toStrictEqual([...ids].sort())
    })

    it('stops at the per-platform limit and deletes the rest, oldest first, on the next run', async () => {
        const ctx = await createPlatform({ auditLogRetentionDays: 30 })
        const ids = await saveEvents({ platformId: ctx.platform.id, ages: [100, 90, 80, 70, 60, 50, 40] })

        const firstRun = await auditLogRetention(app!.log).sweep({ batchSize: 2, maxRowsPerPlatformPerRun: 3 })

        expect(firstRun.deletedCount).toBe(3)
        expect(await remainingIds(ids)).toStrictEqual(ids.slice(3).sort())

        const secondRun = await auditLogRetention(app!.log).sweep({ batchSize: 2, maxRowsPerPlatformPerRun: 3 })
        const thirdRun = await auditLogRetention(app!.log).sweep({ batchSize: 2, maxRowsPerPlatformPerRun: 3 })

        expect(secondRun.deletedCount + thirdRun.deletedCount).toBe(4)
        expect(await remainingIds(ids)).toStrictEqual([])
    })

    it('stops the whole run at the run limit', async () => {
        const first = await createPlatform({ auditLogRetentionDays: 30 })
        const second = await createPlatform({ auditLogRetentionDays: 30 })
        const ids = [
            ...await saveEvents({ platformId: first.platform.id, ages: [40, 50, 60] }),
            ...await saveEvents({ platformId: second.platform.id, ages: [40, 50, 60] }),
        ]

        const summary = await auditLogRetention(app!.log).sweep({ maxRowsPerRun: 4 })

        expect(summary.deletedCount).toBe(4)
        expect(summary.stoppedBy).toBe('rowLimit')
        expect(await remainingIds(ids)).toHaveLength(2)
    })
})

describe('Update platform audit log retention', () => {
    it('saves a value inside the bounds, returns it, and clears it with null', async () => {
        const ctx = await createPlatform({ auditLogRetentionDays: null })

        const saved = await ctx.post(`/v1/platforms/${ctx.platform.id}`, { auditLogRetentionDays: 90 })

        expect(saved.statusCode).toBe(StatusCodes.OK)
        expect(saved.json().auditLogRetentionDays).toBe(90)

        const cleared = await ctx.post(`/v1/platforms/${ctx.platform.id}`, { auditLogRetentionDays: null })

        expect(cleared.statusCode).toBe(StatusCodes.OK)
        expect(cleared.json().auditLogRetentionDays).toBeNull()
    })

    it.each([29, 3651])('rejects %i days when the instance sets no ceiling', async (days) => {
        const ctx = await createPlatform({ auditLogRetentionDays: null })

        const response = await ctx.post(`/v1/platforms/${ctx.platform.id}`, { auditLogRetentionDays: days })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
    })

    it('rejects a value above the instance ceiling', async () => {
        process.env.AP_AUDIT_LOG_RETENTION_DAYS = '365'
        const ctx = await createPlatform({ auditLogRetentionDays: null })

        const response = await ctx.post(`/v1/platforms/${ctx.platform.id}`, { auditLogRetentionDays: 366 })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
    })

    it('accepts only null when the instance ceiling is under the minimum', async () => {
        process.env.AP_AUDIT_LOG_RETENTION_DAYS = '7'
        const ctx = await createPlatform({ auditLogRetentionDays: null })

        const rejected = await ctx.post(`/v1/platforms/${ctx.platform.id}`, { auditLogRetentionDays: 30 })
        const accepted = await ctx.post(`/v1/platforms/${ctx.platform.id}`, { auditLogRetentionDays: null })

        expect(rejected.statusCode).toBe(StatusCodes.CONFLICT)
        expect(accepted.statusCode).toBe(StatusCodes.OK)
    })

    it('refuses the change when the plan has no audit logs', async () => {
        const ctx = await createTestContext(app!, { plan: { auditLogEnabled: false } })

        const response = await ctx.post(`/v1/platforms/${ctx.platform.id}`, { auditLogRetentionDays: 90 })

        expect(response.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
        const platform = await ctx.get(`/v1/platforms/${ctx.platform.id}`)
        expect(platform.json().auditLogRetentionDays).toBeNull()
    })

    it('exposes the instance ceiling as a flag', async () => {
        process.env.AP_AUDIT_LOG_RETENTION_DAYS = '365'
        const ctx = await createPlatform({ auditLogRetentionDays: null })

        const response = await ctx.get('/v1/flags')

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()[ApFlagId.AUDIT_LOG_RETENTION_DAYS]).toBe(365)
    })
})
