import { apId } from '@activepieces/core-utils'
import { ApplicationEventName, EventDestinationScope, PieceChangeType, PieceSelectionMode } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { pieceSetCatalogHooks } from '../../../../src/app/ee/pieces/piece-set/piece-set-catalog-hooks'
import { eventDestinationEntitlementHooks } from '../../../../src/app/ee/platform-webhooks/event-destination-entitlement-hooks'
import { EventDestinationHooks, eventDestinationHooks } from '../../../../src/app/event-destinations/event-destinations-hooks'
import { eventDestinationService } from '../../../../src/app/event-destinations/event-destinations.service'
import { CatalogChange } from '../../../../src/app/pieces/piece-catalog/catalog-diff'
import { PieceCatalogHooks, pieceCatalogHooks, PieceSetVisibility } from '../../../../src/app/pieces/piece-catalog/piece-catalog-hooks'
import * as jobQueueModule from '../../../../src/app/workers/job-queue/job-queue'
import { db } from '../../../helpers/db'
import { createMockEventDestination } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const ENTITLED_PLAN = { plan: { eventStreamingEnabled: true } }

const PIECE_EVENTS = [ApplicationEventName.PIECE_CREATED, ApplicationEventName.PIECE_VERSION_CREATED]

const buildChange = (overrides?: Partial<CatalogChange>): CatalogChange => ({
    name: '@activepieces/piece-gmail',
    displayName: 'Gmail',
    version: '1.1.0',
    previousVersion: '1.0.0',
    changeType: 'minor',
    minimumSupportedRelease: '0.30.0',
    deprecated: false,
    ...overrides,
})

const subscribe = async ({ platformId, events = PIECE_EVENTS, enabled = true, changeTypes }: SubscribeParams): Promise<string> => {
    const destination = createMockEventDestination({
        platformId,
        events,
        enabled,
        scope: EventDestinationScope.PLATFORM,
        url: 'https://collector.example.com/v1/events',
        eventFilters: changeTypes === undefined ? null : { piece: { changeTypes } },
    })
    await db.save('event_destination', destination)
    return destination.id
}

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const originalJobQueue = jobQueueModule.jobQueue

describe('Piece catalog broadcast', () => {
    let addSpy: ReturnType<typeof vi.fn>

    const queuedJobs = (): QueuedJob[] => addSpy.mock.calls.map(([job]) => job as QueuedJob)

    beforeEach(async () => {
        await databaseConnection().getRepository('event_destination').createQueryBuilder().delete().execute()
        addSpy = vi.fn()
        vi.spyOn(jobQueueModule, 'jobQueue').mockImplementation((log) => ({
            ...originalJobQueue(log),
            add: addSpy,
        }))
    })

    afterEach(() => {
        vi.restoreAllMocks()
        eventDestinationHooks.set(eventDestinationEntitlementHooks)
        pieceCatalogHooks.set(pieceSetCatalogHooks)
    })

    it('broadcast reaches two subscribed platforms once each', async () => {
        const first = await createTestContext(app, ENTITLED_PLAN)
        const second = await createTestContext(app, ENTITLED_PLAN)
        const firstDestinationId = await subscribe({ platformId: first.platform.id })
        const secondDestinationId = await subscribe({ platformId: second.platform.id })

        const result = await eventDestinationService(app.log).broadcast({ changes: [buildChange()] })

        const jobs = queuedJobs()
        expect(result.queued).toBe(2)
        expect(jobs).toHaveLength(2)
        expect(jobs.map((job) => job.data.webhookId).sort()).toEqual([firstDestinationId, secondDestinationId].sort())
        expect(jobs.map((job) => job.data.payload.platformId).sort()).toEqual([first.platform.id, second.platform.id].sort())
        for (const job of jobs) {
            expect(job.data.lowPriority).toBe(true)
            expect(job.data.projectId).toBeUndefined()
            expect(job.data.payload).not.toHaveProperty('projectId')
            expect(job.data.payload).not.toHaveProperty('userId')
            expect(job.data.payload).not.toHaveProperty('ip')
            expect(job.data.payload.action).toBe(ApplicationEventName.PIECE_VERSION_CREATED)
            expect(job.data.payload.data.piece).toMatchObject({ name: '@activepieces/piece-gmail', changeType: 'minor', pieceType: 'OFFICIAL' })
        }
    })

    it('unsubscribed, disabled and unentitled destinations get nothing', async () => {
        const unsubscribed = await createTestContext(app, ENTITLED_PLAN)
        const disabled = await createTestContext(app, ENTITLED_PLAN)
        const unentitled = await createTestContext(app, { plan: { eventStreamingEnabled: false } })
        await subscribe({ platformId: unsubscribed.platform.id, events: [ApplicationEventName.FLOW_CREATED] })
        await subscribe({ platformId: disabled.platform.id, enabled: false })
        await subscribe({ platformId: unentitled.platform.id })

        const result = await eventDestinationService(app.log).broadcast({ changes: [buildChange()] })

        expect(result.queued).toBe(0)
        expect(addSpy).not.toHaveBeenCalled()
    })

    it('destination with every old event gets nothing', async () => {
        const ctx = await createTestContext(app, ENTITLED_PLAN)
        const oldEvents = Object.values(ApplicationEventName).filter((event) => !PIECE_EVENTS.includes(event))
        expect(oldEvents.length).toBeGreaterThan(0)
        expect(oldEvents).not.toContain(ApplicationEventName.PIECE_CREATED)
        expect(oldEvents).not.toContain(ApplicationEventName.PIECE_VERSION_CREATED)
        await subscribe({ platformId: ctx.platform.id, events: oldEvents })

        const result = await eventDestinationService(app.log).broadcast({ changes: [buildChange({ changeType: 'new', previousVersion: null })] })

        expect(result.queued).toBe(0)
        expect(addSpy).not.toHaveBeenCalled()
    })

    it('destination subscribed to piece.created only gets no version event', async () => {
        const ctx = await createTestContext(app, ENTITLED_PLAN)
        await subscribe({ platformId: ctx.platform.id, events: [ApplicationEventName.PIECE_CREATED] })

        const versionResult = await eventDestinationService(app.log).broadcast({ changes: [buildChange({ changeType: 'major', previousVersion: '0.9.0' })] })
        const createdResult = await eventDestinationService(app.log).broadcast({ changes: [buildChange({ changeType: 'new', previousVersion: null })] })

        expect(versionResult.queued).toBe(0)
        expect(createdResult.queued).toBe(1)
        expect(queuedJobs().map((job) => job.data.payload.action)).toEqual([ApplicationEventName.PIECE_CREATED])
    })

    it('default filter drops patch when eventFilters is null', async () => {
        const ctx = await createTestContext(app, ENTITLED_PLAN)
        await subscribe({ platformId: ctx.platform.id })

        const patchResult = await eventDestinationService(app.log).broadcast({ changes: [buildChange({ changeType: 'patch', version: '1.0.1' })] })
        const minorResult = await eventDestinationService(app.log).broadcast({ changes: [buildChange({ changeType: 'minor' })] })

        expect(patchResult.queued).toBe(0)
        expect(minorResult.queued).toBe(1)
        expect(queuedJobs().map((job) => job.data.payload.data.piece.changeType)).toEqual(['minor'])
    })

    it('opt-in filter receives patch', async () => {
        const ctx = await createTestContext(app, ENTITLED_PLAN)
        await subscribe({ platformId: ctx.platform.id, changeTypes: ['new', 'major', 'minor', 'patch'] })

        const result = await eventDestinationService(app.log).broadcast({ changes: [buildChange({ changeType: 'patch', version: '1.0.1' })] })

        expect(result.queued).toBe(1)
        expect(queuedJobs()[0].data.payload.data.piece).toMatchObject({ changeType: 'patch', version: '1.0.1' })
    })

    it('same delivery key yields the same job id', async () => {
        const ctx = await createTestContext(app, ENTITLED_PLAN)
        await subscribe({ platformId: ctx.platform.id })
        const change = buildChange()

        await eventDestinationService(app.log).broadcast({ changes: [change] })
        await eventDestinationService(app.log).broadcast({ changes: [change] })

        const ids = queuedJobs().map((job) => job.id)
        expect(ids).toHaveLength(2)
        expect(ids[0]).toBe(ids[1])
        expect(ids[0]).toMatch(/^pce-[0-9a-f]{24}$/)
        expect(ids[0]).not.toContain(':')
    })

    it('dispatches a platform\'s deliveries at most 25 at a time', async () => {
        const ctx = await createTestContext(app, ENTITLED_PLAN)
        await subscribe({ platformId: ctx.platform.id, changeTypes: ['new', 'major', 'minor', 'patch'] })
        let inFlight = 0
        let maxInFlight = 0
        addSpy.mockImplementation(async () => {
            inFlight++
            maxInFlight = Math.max(maxInFlight, inFlight)
            await new Promise((resolve) => setTimeout(resolve, 5))
            inFlight--
        })
        const changes = Array.from({ length: 60 }, (_, index) => buildChange({ name: `@test/bulk-${String(index).padStart(2, '0')}` }))

        const result = await eventDestinationService(app.log).broadcast({ changes })

        expect(result).toEqual({ queued: 60, failedPlatformIds: [] })
        expect(addSpy).toHaveBeenCalledTimes(60)
        expect(maxInFlight).toBe(25)
    })

    it('S13 pieceSets payload: include_all with an exception and exclude_all', async () => {
        const ctx = await createTestContext(app, ENTITLED_PLAN)
        const platformId = ctx.platform.id
        await subscribe({ platformId })
        await databaseConnection().getRepository('piece_set').delete({ platformId })
        const isoNow = new Date().toISOString()
        const makeSet = (name: string, key: string, mode: PieceSelectionMode, exceptions: string[], isDefault: boolean) => ({
            id: apId(), created: isoNow, updated: isoNow, platformId, name, key, isDefault, generatedForProjectId: null,
            config: { pieces: { mode, exceptions }, selectedActions: {}, selectedTriggers: {}, requiredActions: { mode: 'any', actions: {} } },
        })
        const includeAllExceptP0 = makeSet('Include all but piece-00', 'inc', PieceSelectionMode.INCLUDE_ALL, ['@test/piece-00'], false)
        const onlyP0 = makeSet('Only piece-00', 'exc', PieceSelectionMode.EXCLUDE_ALL, ['@test/piece-00'], false)
        const everything = makeSet('Default', 'default', PieceSelectionMode.INCLUDE_ALL, [], true)
        await databaseConnection().getRepository('piece_set').save([includeAllExceptP0, onlyP0, everything])

        await eventDestinationService(app.log).broadcast({
            changes: [
                buildChange({ name: '@test/piece-00', version: '1.1.0' }),
                buildChange({ name: '@test/piece-01', version: '1.0.1', changeType: 'new', previousVersion: null }),
            ],
        })

        const keysFor = (name: string): string[] => (queuedJobs().find((job) => job.data.payload.data.piece.name === name)?.data.payload.data.pieceSets ?? []).map((set) => set.key ?? '').sort()
        expect(keysFor('@test/piece-00')).toEqual(['default', 'exc'])
        expect(keysFor('@test/piece-01')).toEqual(['default', 'inc'])
    })

    it('reads entitlement and piece sets once for every subscribed platform', async () => {
        const platformIds: string[] = []
        for (let index = 0; index < 3; index++) {
            const context = await createTestContext(app, ENTITLED_PLAN)
            await subscribe({ platformId: context.platform.id })
            platformIds.push(context.platform.id)
        }
        const realEntitlement = eventDestinationEntitlementHooks(app.log)
        const realPieceSets = pieceSetCatalogHooks(app.log)
        const entitlementReads: string[][] = []
        const pieceSetReads: string[][] = []
        eventDestinationHooks.set((): EventDestinationHooks => ({
            isDeliveryEntitled: async () => {
                throw new Error('per-platform entitlement read')
            },
            listDeliveryEntitledPlatformIds: async (params) => {
                entitlementReads.push([...params.platformIds].sort())
                return realEntitlement.listDeliveryEntitledPlatformIds(params)
            },
        }))
        pieceCatalogHooks.set((): PieceCatalogHooks => ({
            listPieceSets: async (params) => {
                pieceSetReads.push([...params.platformIds].sort())
                return realPieceSets.listPieceSets(params)
            },
        }))

        const result = await eventDestinationService(app.log).broadcast({ changes: [buildChange()] })

        expect(result).toEqual({ queued: 3, failedPlatformIds: [] })
        expect(entitlementReads).toEqual([[...platformIds].sort()])
        expect(pieceSetReads).toEqual([[...platformIds].sort()])
    })

    it('a failed piece-set read reports every subscribed platform as failed and queues nothing', async () => {
        const first = await createTestContext(app, ENTITLED_PLAN)
        const second = await createTestContext(app, ENTITLED_PLAN)
        await subscribe({ platformId: first.platform.id })
        await subscribe({ platformId: second.platform.id })
        pieceCatalogHooks.set((): PieceCatalogHooks => ({
            listPieceSets: async () => {
                throw new Error('piece set read failed')
            },
        }))

        const result = await eventDestinationService(app.log).broadcast({ changes: [buildChange()] })

        expect(result.queued).toBe(0)
        expect([...result.failedPlatformIds].sort()).toEqual([first.platform.id, second.platform.id].sort())
        expect(addSpy).not.toHaveBeenCalled()
    })

    it('one platform\'s malformed piece set does not block the others', async () => {
        const failing = await createTestContext(app, ENTITLED_PLAN)
        const healthy = await createTestContext(app, ENTITLED_PLAN)
        await subscribe({ platformId: failing.platform.id })
        const healthyDestinationId = await subscribe({ platformId: healthy.platform.id })
        pieceCatalogHooks.set((): PieceCatalogHooks => ({
            listPieceSets: async () => new Map([
                [failing.platform.id, [{ id: 'broken', key: null, name: 'broken', isDefault: false, pieces: null as unknown as PieceSetVisibility['pieces'] }]],
            ]),
        }))

        const result = await eventDestinationService(app.log).broadcast({ changes: [buildChange()] })

        expect(result).toEqual({ queued: 1, failedPlatformIds: [failing.platform.id] })
        expect(queuedJobs().map((job) => job.data.webhookId)).toEqual([healthyDestinationId])
    })
})

type SubscribeParams = {
    platformId: string
    events?: ApplicationEventName[]
    enabled?: boolean
    changeTypes?: PieceChangeType[]
}

type QueuedJob = {
    id: string
    data: {
        webhookId: string
        projectId?: string
        lowPriority?: boolean
        payload: {
            platformId: string
            action: ApplicationEventName
            data: { piece: Record<string, unknown>, pieceSets: { key: string | null }[] }
        }
    }
}
