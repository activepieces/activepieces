import { ApFlagId, ApplicationEvent, ApplicationEventName, EventDestinationScope, WorkerJobType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { In } from 'typeorm'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { auditLogRepo } from '../../../../src/app/ee/audit-logs/audit-event-service'
import { auditLogRetention } from '../../../../src/app/ee/audit-logs/audit-log-retention'
import * as applicationEventsModule from '../../../../src/app/helper/application-events'
import * as jobQueueModule from '../../../../src/app/workers/job-queue/job-queue'
import { actionsEmitted } from '../../../helpers/application-events'
import { db } from '../../../helpers/db'
import { createAuditEvent, createMockEventDestination } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterEach(async () => {
    delete process.env.AP_AUDIT_LOG_RETENTION_DAYS
    delete process.env.AP_AUDIT_LOG_RETENTION_PAUSED
    await databaseConnection().query('DROP TRIGGER IF EXISTS audit_event_test_trigger ON "audit_event"')
    await databaseConnection().query('DROP FUNCTION IF EXISTS audit_event_test_trigger()')
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

const installDeleteTrigger = async ({ body }: { body: string }): Promise<void> => {
    await databaseConnection().query(`CREATE FUNCTION audit_event_test_trigger() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN ${body} RETURN OLD; END $$`)
    await databaseConnection().query('CREATE TRIGGER audit_event_test_trigger BEFORE DELETE ON "audit_event" FOR EACH ROW EXECUTE FUNCTION audit_event_test_trigger()')
}

const autovacuumOptions = async (): Promise<string[]> => {
    const rows: { reloptions: string[] | null }[] = await databaseConnection().query('SELECT reloptions FROM pg_class WHERE oid = \'"audit_event"\'::regclass')
    return rows[0]?.reloptions ?? []
}

const remainingIds = async (ids: string[]): Promise<string[]> => {
    const rows = await auditLogRepo().findBy({ id: In(ids) })
    return rows.map((row) => row.id).sort()
}

const savedRetentionEvents = async ({ platformId, expectedCount }: { platformId: string, expectedCount: number }): Promise<ApplicationEvent[]> => {
    const find = async (): Promise<ApplicationEvent[]> => {
        const events = await auditLogRepo().find({ where: { platformId }, order: { created: 'ASC' } })
        return events.filter((event) => event.action === ApplicationEventName.AUDIT_LOG_RETENTION_UPDATED)
    }
    await vi.waitUntil(async () => (await find()).length >= expectedCount, { timeout: 5000, interval: 50 })
    return find()
}

const originalApplicationEvents = applicationEventsModule.applicationEvents
const originalJobQueue = jobQueueModule.jobQueue

const createPlatform = async ({ auditLogRetentionDays, auditLogEnabled = true }: { auditLogRetentionDays: number | null, auditLogEnabled?: boolean }) => {
    return createTestContext(app!, {
        platform: { auditLogRetentionDays },
        plan: { auditLogEnabled },
    })
}

describe('auditLogRetention.sweep', () => {
    beforeEach(async () => {
        await databaseConnection().query('DELETE FROM "audit_event"')
    })

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

    it('ignores the saved period of a platform whose plan has no audit logs', async () => {
        const ctx = await createPlatform({ auditLogRetentionDays: 30, auditLogEnabled: false })
        const ids = await saveEvents({ platformId: ctx.platform.id, ages: [45, 400] })

        await auditLogRetention(app!.log).sweep()

        expect(await remainingIds(ids)).toStrictEqual([...ids].sort())
    })

    it('applies only the instance ceiling to a platform whose plan has no audit logs', async () => {
        process.env.AP_AUDIT_LOG_RETENTION_DAYS = '60'
        const ctx = await createPlatform({ auditLogRetentionDays: 30, auditLogEnabled: false })
        const [fresh, expired] = await saveEvents({ platformId: ctx.platform.id, ages: [45, 400] })

        await auditLogRetention(app!.log).sweep()

        expect(await remainingIds([fresh, expired])).toStrictEqual([fresh])
    })

    it('applies only the instance ceiling to a platform without a plan row', async () => {
        process.env.AP_AUDIT_LOG_RETENTION_DAYS = '60'
        const ctx = await createPlatform({ auditLogRetentionDays: 30 })
        await databaseConnection().query('DELETE FROM "platform_plan" WHERE "platformId" = $1', [ctx.platform.id])
        const [fresh, expired] = await saveEvents({ platformId: ctx.platform.id, ages: [45, 400] })

        await auditLogRetention(app!.log).sweep()

        expect(await remainingIds([fresh, expired])).toStrictEqual([fresh])
    })

    it.each(['0', '7'])('ignores the malformed or too short ceiling %j instead of deleting everything', async (ceiling) => {
        process.env.AP_AUDIT_LOG_RETENTION_DAYS = ceiling
        const ctx = await createPlatform({ auditLogRetentionDays: null })
        const ids = await saveEvents({ platformId: ctx.platform.id, ages: [1, 100] })

        await auditLogRetention(app!.log).sweep()

        expect(await remainingIds(ids)).toStrictEqual([...ids].sort())
    })

    it('gives one platform more rounds while the run has budget, oldest first', async () => {
        const ctx = await createPlatform({ auditLogRetentionDays: 30 })
        const ids = await saveEvents({ platformId: ctx.platform.id, ages: [100, 90, 80, 70, 60, 50, 40] })

        const firstRun = await auditLogRetention(app!.log).sweep({ batchSize: 2, maxRowsPerPlatformPerRound: 3, maxRowsPerRun: 5 })

        expect(firstRun.deletedCount).toBe(5)
        expect(firstRun.stoppedBy).toBe('rowLimit')
        expect(firstRun.platformsLeft).toBe(1)
        expect(await remainingIds(ids)).toStrictEqual(ids.slice(5).sort())

        const secondRun = await auditLogRetention(app!.log).sweep({ batchSize: 2, maxRowsPerPlatformPerRound: 3 })

        expect(secondRun.deletedCount).toBe(2)
        expect(secondRun.stoppedBy).toBe('done')
        expect(secondRun.platformsLeft).toBe(0)
        expect(await remainingIds(ids)).toStrictEqual([])
    })

    it('shares the run between platforms in rounds', async () => {
        const first = await createPlatform({ auditLogRetentionDays: 30 })
        const second = await createPlatform({ auditLogRetentionDays: 30 })
        const firstIds = await saveEvents({ platformId: first.platform.id, ages: [40, 50, 60, 70, 80] })
        const secondIds = await saveEvents({ platformId: second.platform.id, ages: [40, 50, 60, 70, 80] })

        const summary = await auditLogRetention(app!.log).sweep({ batchSize: 2, maxRowsPerPlatformPerRound: 2, maxRowsPerRun: 6 })

        expect(summary.deletedCount).toBe(6)
        expect((await remainingIds(firstIds)).length).toBeLessThanOrEqual(3)
        expect((await remainingIds(secondIds)).length).toBeLessThanOrEqual(3)
    })

    it('deletes every expired event when many share the same created time', async () => {
        const ctx = await createPlatform({ auditLogRetentionDays: 30 })
        const created = daysAgo(40)
        const events = Array.from({ length: 7 }, () => createAuditEvent({ platformId: ctx.platform.id, created, updated: created }))
        await db.save('audit_event', events)

        const summary = await auditLogRetention(app!.log).sweep({ batchSize: 2 })

        expect(summary.deletedCount).toBe(7)
        expect(await remainingIds(events.map((event) => event.id))).toStrictEqual([])
    })

    it('reports the platforms left when the time budget runs out', async () => {
        const ctx = await createPlatform({ auditLogRetentionDays: 30 })
        const ids = await saveEvents({ platformId: ctx.platform.id, ages: [40, 50] })

        const summary = await auditLogRetention(app!.log).sweep({ runBudgetMs: 0 })

        expect(summary.deletedCount).toBe(0)
        expect(summary.platformsLeft).toBe(1)
        expect(summary.stoppedBy).toBe('timeBudget')
        expect(await remainingIds(ids)).toStrictEqual([...ids].sort())
    })

    it('deletes nothing while AP_AUDIT_LOG_RETENTION_PAUSED is true', async () => {
        process.env.AP_AUDIT_LOG_RETENTION_PAUSED = 'true'
        const ctx = await createPlatform({ auditLogRetentionDays: 30 })
        const ids = await saveEvents({ platformId: ctx.platform.id, ages: [40, 50] })

        const summary = await auditLogRetention(app!.log).sweep()

        expect(summary.deletedCount).toBe(0)
        expect(summary.stoppedBy).toBe('paused')
        expect(await remainingIds(ids)).toStrictEqual([...ids].sort())
    })

    it('reads the retention period again before each batch', async () => {
        const ctx = await createPlatform({ auditLogRetentionDays: 30 })
        const ids = await saveEvents({ platformId: ctx.platform.id, ages: [100, 90, 80, 70] })
        await installDeleteTrigger({
            body: `IF OLD.id = '${ids[0]}' THEN UPDATE "platform" SET "auditLogRetentionDays" = NULL WHERE id = '${ctx.platform.id}'; END IF;`,
        })

        const summary = await auditLogRetention(app!.log).sweep({ batchSize: 2 })

        expect(summary.deletedCount).toBe(2)
        expect(await remainingIds(ids)).toStrictEqual(ids.slice(2).sort())
    })

    it('counts the batches a platform deleted before it failed', async () => {
        const ctx = await createPlatform({ auditLogRetentionDays: 30 })
        const ids = await saveEvents({ platformId: ctx.platform.id, ages: [100, 90, 80, 70] })
        await installDeleteTrigger({
            body: `IF OLD.id = '${ids[2]}' THEN RAISE EXCEPTION 'poisoned row'; END IF;`,
        })

        const summary = await auditLogRetention(app!.log).sweep({ batchSize: 2 })

        expect(summary.deletedCount).toBe(2)
        expect(summary.platformsFailed).toBe(1)
        expect(summary.stoppedBy).toBe('failed')
        expect(await remainingIds(ids)).toStrictEqual(ids.slice(2).sort())
    })

    it('sets the autovacuum scale factor of audit_event the first time it has events to delete', async () => {
        await databaseConnection().query('ALTER TABLE "audit_event" RESET (autovacuum_vacuum_scale_factor)')
        const ctx = await createPlatform({ auditLogRetentionDays: 30 })
        await saveEvents({ platformId: ctx.platform.id, ages: [40] })

        await auditLogRetention(app!.log).sweep()

        expect(await autovacuumOptions()).toContain('autovacuum_vacuum_scale_factor=0.02')
    })

    it('keeps an autovacuum scale factor that an operator already set', async () => {
        await databaseConnection().query('ALTER TABLE "audit_event" SET (autovacuum_vacuum_scale_factor = 0.05)')
        const ctx = await createPlatform({ auditLogRetentionDays: 30 })
        await saveEvents({ platformId: ctx.platform.id, ages: [40] })

        await auditLogRetention(app!.log).sweep()

        expect(await autovacuumOptions()).toContain('autovacuum_vacuum_scale_factor=0.05')
        await databaseConnection().query('ALTER TABLE "audit_event" RESET (autovacuum_vacuum_scale_factor)')
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

describe('List audit events', () => {
    it('returns the oldest event first when asked for ascending order', async () => {
        const ctx = await createPlatform({ auditLogRetentionDays: null })
        const other = await createPlatform({ auditLogRetentionDays: null })
        const [newest, oldest, middle] = await saveEvents({ platformId: ctx.platform.id, ages: [10, 300, 50] })
        await saveEvents({ platformId: other.platform.id, ages: [900] })

        const ascending = await ctx.get('/v1/audit-events', { order: 'ASC', limit: 1 })
        const descending = await ctx.get('/v1/audit-events', { limit: 3 })

        expect(ascending.statusCode).toBe(StatusCodes.OK)
        expect(ascending.json().data.map((event: ApplicationEvent) => event.id)).toStrictEqual([oldest])
        expect(descending.json().data.map((event: ApplicationEvent) => event.id)).toStrictEqual([newest, middle, oldest])
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

    it('accepts the minimum when the instance ceiling is under it, because that ceiling is ignored', async () => {
        process.env.AP_AUDIT_LOG_RETENTION_DAYS = '7'
        const ctx = await createPlatform({ auditLogRetentionDays: null })

        const response = await ctx.post(`/v1/platforms/${ctx.platform.id}`, { auditLogRetentionDays: 30 })

        expect(response.statusCode).toBe(StatusCodes.OK)
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

    it('exposes the paused cleanup as a flag', async () => {
        process.env.AP_AUDIT_LOG_RETENTION_PAUSED = 'true'
        const ctx = await createPlatform({ auditLogRetentionDays: null })

        const response = await ctx.get('/v1/flags')

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(response.json()[ApFlagId.AUDIT_LOG_RETENTION_PAUSED]).toBe(true)
    })
})

describe('Audit log retention change event', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('records who changed the retention, with the previous and new values and the instance limit', async () => {
        process.env.AP_AUDIT_LOG_RETENTION_DAYS = '365'
        const ctx = await createPlatform({ auditLogRetentionDays: null })

        await ctx.inject({
            method: 'POST',
            url: `/api/v1/platforms/${ctx.platform.id}`,
            body: { auditLogRetentionDays: 90 },
            headers: { 'x-real-ip': '203.0.113.7' },
        })
        const [event] = await savedRetentionEvents({ platformId: ctx.platform.id, expectedCount: 1 })

        expect(event.userId).toBe(ctx.user.id)
        expect(event.userEmail).toBe(ctx.userIdentity.email)
        expect(event.ip).toBe('203.0.113.7')
        expect(event.projectId).toBeNull()
        expect(event.data).toEqual(expect.objectContaining({ previousRetentionDays: null, retentionDays: 90, instanceLimitDays: 365 }))

        await ctx.post(`/v1/platforms/${ctx.platform.id}`, { auditLogRetentionDays: null })
        const events = await savedRetentionEvents({ platformId: ctx.platform.id, expectedCount: 2 })

        expect(events.map((saved) => saved.data)).toEqual(expect.arrayContaining([
            expect.objectContaining({ previousRetentionDays: 90, retentionDays: null, instanceLimitDays: 365 }),
        ]))
    })

    it('sends nothing when the value does not change or the change is refused', async () => {
        const sendUserEventSpy = vi.fn()
        vi.spyOn(applicationEventsModule, 'applicationEvents').mockImplementation((log) => ({
            ...originalApplicationEvents(log),
            sendUserEvent: sendUserEventSpy,
        }))
        const ctx = await createPlatform({ auditLogRetentionDays: 90 })

        const sameValue = await ctx.post(`/v1/platforms/${ctx.platform.id}`, { auditLogRetentionDays: 90 })
        const otherField = await ctx.post(`/v1/platforms/${ctx.platform.id}`, { name: 'Renamed platform' })
        const refused = await ctx.post(`/v1/platforms/${ctx.platform.id}`, { auditLogRetentionDays: 29 })

        expect([sameValue.statusCode, otherField.statusCode, refused.statusCode]).toEqual([StatusCodes.OK, StatusCodes.OK, StatusCodes.CONFLICT])
        expect(actionsEmitted(sendUserEventSpy)).toEqual([])

        await ctx.post(`/v1/platforms/${ctx.platform.id}`, { auditLogRetentionDays: 30 })

        expect(actionsEmitted(sendUserEventSpy)).toEqual([ApplicationEventName.AUDIT_LOG_RETENTION_UPDATED])
    })

    it('delivers the change to an event destination that subscribes to it', async () => {
        const addSpy = vi.fn()
        vi.spyOn(jobQueueModule, 'jobQueue').mockImplementation((log) => ({
            ...originalJobQueue(log),
            add: addSpy,
        }))
        const ctx = await createTestContext(app!, {
            platform: { auditLogRetentionDays: null },
            plan: { auditLogEnabled: true, eventStreamingEnabled: true },
        })
        const destination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.AUDIT_LOG_RETENTION_UPDATED],
            scope: EventDestinationScope.PLATFORM,
        })
        await db.save('event_destination', destination)

        await ctx.post(`/v1/platforms/${ctx.platform.id}`, { auditLogRetentionDays: 30 })

        await vi.waitFor(() => expect(addSpy).toHaveBeenCalledTimes(1), { timeout: 5000 })
        expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                jobType: WorkerJobType.EVENT_DESTINATION,
                webhookUrl: destination.url,
                payload: expect.objectContaining({
                    action: ApplicationEventName.AUDIT_LOG_RETENTION_UPDATED,
                    data: expect.objectContaining({ previousRetentionDays: null, retentionDays: 30 }),
                }),
            }),
        }))
    })
})
