import { apId } from '@activepieces/core-utils'
import { ApEdition, ApplicationEventName, EngineResponseStatus, EventDestinationScope, PackageType, PieceChangeType, PieceScope, PieceType, WorkerJobType } from '@activepieces/shared'
import { UnrecoverableError } from 'bullmq'
import fastify, { FastifyInstance } from 'fastify'
import { validatorCompiler } from 'fastify-type-provider-zod'
import { Mock } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import * as redisConnectionsModule from '../../../../src/app/database/redis-connections'
import { adminPlatformModule } from '../../../../src/app/ee/platform/admin/admin-platform.controller'
import { eventDestinationEntitlementHooks } from '../../../../src/app/ee/platform-webhooks/event-destination-entitlement-hooks'
import { eventDestinationHooks } from '../../../../src/app/event-destinations/event-destinations-hooks'
import * as eventDestinationsModule from '../../../../src/app/event-destinations/event-destinations.service'
import * as flagServiceModule from '../../../../src/app/flags/flag.service'
import { system } from '../../../../src/app/helper/system/system'
import { SystemJobName } from '../../../../src/app/helper/system-jobs/common'
import { systemJobHandlers } from '../../../../src/app/helper/system-jobs/job-handlers'
import { systemJobsQueue, systemJobsSchedule } from '../../../../src/app/helper/system-jobs/system-job'
import { pieceMetadataService } from '../../../../src/app/pieces/metadata/piece-metadata-service'
import * as catalogDiffModule from '../../../../src/app/pieces/piece-catalog/catalog-diff'
import { catalogSnapshotStore } from '../../../../src/app/pieces/piece-catalog/catalog-snapshot-store'
import * as catalogJobModule from '../../../../src/app/pieces/piece-catalog/piece-catalog-events.job'
import { pieceInstallService } from '../../../../src/app/pieces/piece-install-service'
import { pieceSyncService } from '../../../../src/app/pieces/piece-sync-service'
import * as jobQueueModule from '../../../../src/app/workers/job-queue/job-queue'
import { userInteractionWatcher } from '../../../../src/app/workers/user-interaction-watcher'
import { db } from '../../../helpers/db'
import { createMockEventDestination } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const originalSyncMode = vi.hoisted(() => {
    const previous = process.env.AP_PIECES_SYNC_MODE
    process.env.AP_PIECES_SYNC_MODE = 'OFFICIAL_AUTO'
    return previous
})

const CLOUD_PIECES_URL = 'https://cloud.activepieces.com/api/v1/pieces'
const PIECE_EVENTS = [ApplicationEventName.PIECE_CREATED, ApplicationEventName.PIECE_VERSION_CREATED]
const CATALOG_JOB_IDS = ['piece-catalog-events', 'piece-catalog-events-follow-up']
const SNAPSHOT_FLAG_ID = 'PIECE_CATALOG_SNAP'
const ALL_CHANGE_TYPES: PieceChangeType[] = ['new', 'major', 'minor', 'patch']

let app: FastifyInstance
let adminApp: FastifyInstance
let entitledA: TestContext
let entitledB: TestContext
let unentitled: TestContext
let registry: CloudPiece[] = []
let addSpy: Mock<JobQueueAdd>
let pendingHooks: Promise<unknown>[] = []
let fetchDelayMs = 0
let broadcastCalls: string[][] = []
let beforeBroadcast: (() => Promise<void>) | null = null
const cloudIds = new Map<string, string>()
const originalJobQueue = jobQueueModule.jobQueue
const originalCatalogJob = catalogJobModule.pieceCatalogEventsJob
const originalEventDestinationService = eventDestinationsModule.eventDestinationService
const originalFlagService = flagServiceModule.flagService

function cloudPiece({ name, version }: { name: string, version: string }): CloudPiece {
    const key = `${name}@${version}`
    const id = cloudIds.get(key) ?? apId()
    cloudIds.set(key, id)
    const isoNow = new Date().toISOString()
    return {
        id,
        created: isoNow,
        updated: isoNow,
        name,
        displayName: name.replace('@test/', ''),
        logoUrl: 'https://cdn.activepieces.com/pieces/test.png',
        description: 'test piece',
        authors: [],
        version,
        minimumSupportedRelease: '0.0.0',
        maximumSupportedRelease: '999.999.999',
        actions: {},
        triggers: {},
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        categories: [],
        deprecated: false,
        projectUsage: 0,
    }
}

function baseCatalog(): CloudPiece[] {
    return Array.from({ length: 30 }, (_, index) => `@test/piece-${String(index).padStart(2, '0')}`)
        .flatMap((name) => ['0.1.0', '0.2.0', '1.0.0'].map((version) => cloudPiece({ name, version })))
}

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

function stubCloudFetch(): void {
    const realFetch = globalThis.fetch
    vi.stubGlobal('fetch', async (input: string | URL | Request, init?: RequestInit) => {
        const target = input instanceof Request ? input.url : String(input)
        if (!target.startsWith(CLOUD_PIECES_URL)) {
            return realFetch(input, init)
        }
        const url = new URL(target)
        await sleep(Math.floor(Math.random() * 4))
        if (url.pathname === '/api/v1/pieces/registry') {
            return jsonResponse(registry.map((piece) => ({ name: piece.name, version: piece.version })))
        }
        await sleep(fetchDelayMs)
        const name = decodeURIComponent(url.pathname.slice('/api/v1/pieces/'.length))
        const version = url.searchParams.get('version')
        const match = registry.find((piece) => piece.name === name && piece.version === version)
        return match ? jsonResponse(match) : jsonResponse({ message: 'not found' }, 404)
    })
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function sync(): Promise<void> {
    await pieceSyncService(app.log).sync({ publishCacheRefresh: false })
}

async function settleCatalogJobs(): Promise<void> {
    const deadline = Date.now() + 30_000
    while (Date.now() < deadline) {
        const hooks = pendingHooks
        pendingHooks = []
        await Promise.all(hooks)
        const jobs = await Promise.all(CATALOG_JOB_IDS.map((jobId) => systemJobsSchedule(app.log).getJob(jobId)))
        const failed = jobs.find((job) => job !== undefined && job.attemptsMade > 0 && job.failedReason)
        if (failed) {
            throw new Error(`catalog job failed: ${failed.failedReason}`)
        }
        if (jobs.every((job) => job === undefined) && pendingHooks.length === 0) {
            return
        }
        await sleep(50)
    }
    throw new Error('catalog jobs did not settle')
}

async function subscribe({ platformId, events = PIECE_EVENTS, changeTypes }: SubscribeParams): Promise<string> {
    const destination = createMockEventDestination({
        platformId,
        events,
        scope: EventDestinationScope.PLATFORM,
        url: `https://collector.example.com/${apId()}`,
        eventFilters: changeTypes === undefined ? null : { piece: { changeTypes } },
    })
    await db.save('event_destination', destination)
    return destination.id
}

function deliveries(): Delivery[] {
    return addSpy.mock.calls
        .map((call) => call[0] as unknown as QueuedJob)
        .filter((job) => job.data.jobType === WorkerJobType.EVENT_DESTINATION && PIECE_EVENTS.includes(job.data.payload.action))
        .map((job) => ({ destinationId: job.data.webhookId, event: job.data.payload }))
}

function deliveriesTo(destinationId: string): Delivery[] {
    return deliveries().filter((delivery) => delivery.destinationId === destinationId)
}

async function seed(pieces: CloudPiece[]): Promise<void> {
    registry = pieces
    await sync()
    await settleCatalogJobs()
    addSpy.mockClear()
}

async function resetCatalog(): Promise<void> {
    await databaseConnection().getRepository('piece_metadata').createQueryBuilder().delete().execute()
    await databaseConnection().getRepository('flag').delete([SNAPSHOT_FLAG_ID])
    addSpy.mockClear()
}

async function runCatalogJob(): Promise<void> {
    await systemJobHandlers.getJobHandler(SystemJobName.PIECE_CATALOG_EVENTS)({})
}

function reportPiecesSyncRunning(): void {
    vi.spyOn(systemJobsQueue, 'getActive').mockResolvedValue([{ name: SystemJobName.PIECES_SYNC } as Awaited<ReturnType<typeof systemJobsQueue.getActive>>[number]])
}

async function waitForJobState(jobId: string, state: string): Promise<string> {
    const deadline = Date.now() + 10_000
    let current = await systemJobsSchedule(app.log).getJobState(jobId)
    while (current !== state && Date.now() < deadline) {
        await sleep(50)
        current = await systemJobsSchedule(app.log).getJobState(jobId)
    }
    return current
}

async function runReconcileJob(): Promise<void> {
    await systemJobHandlers.getJobHandler(SystemJobName.PIECE_CATALOG_RECONCILE)({})
}

async function installCustomPiece({ platformId, name, version }: { platformId: string, name: string, version: string }): Promise<void> {
    vi.spyOn(userInteractionWatcher, 'submitAndWaitForResponse').mockResolvedValueOnce({
        status: EngineResponseStatus.OK,
        response: {
            name,
            version,
            displayName: 'Custom X',
            logoUrl: 'https://cdn.activepieces.com/pieces/custom.png',
            description: 'custom',
            auth: undefined,
            actions: {},
            triggers: {},
            minimumSupportedRelease: '0.0.0',
            maximumSupportedRelease: '999.999.999',
            authors: [],
            categories: [],
            i18n: {},
        },
        error: undefined,
    })
    await pieceInstallService(app.log).installPiece(platformId, {
        packageType: PackageType.REGISTRY,
        scope: PieceScope.PLATFORM,
        pieceName: name,
        pieceVersion: version,
    })
}

async function adminPublish({ name, version }: { name: string, version: string }): Promise<number> {
    const response = await adminApp.inject({
        method: 'POST',
        url: '/api/v1/admin/pieces',
        headers: { 'api-key': process.env['AP_API_KEY'] ?? '' },
        body: {
            name,
            displayName: name.replace('@test/', ''),
            logoUrl: 'https://cdn.activepieces.com/pieces/test.png',
            description: 'admin publish',
            version,
            authors: [],
            categories: [],
            minimumSupportedRelease: '0.0.0',
            maximumSupportedRelease: '999.999.999',
            actions: {},
            triggers: {},
        },
    })
    return response.statusCode
}

async function insertOfficialPiece({ name, version, platformId }: { name: string, version: string, platformId?: string }): Promise<void> {
    await pieceMetadataService(app.log).create({
        platformId,
        pieceMetadata: {
            name,
            displayName: name.replace('@test/', ''),
            logoUrl: 'https://cdn.activepieces.com/pieces/test.png',
            description: 'existing',
            authors: [],
            version,
            minimumSupportedRelease: '0.0.0',
            maximumSupportedRelease: '999.999.999',
            actions: {},
            triggers: {},
            contextInfo: undefined,
        },
        packageType: PackageType.REGISTRY,
        pieceType: PieceType.OFFICIAL,
        publishCacheRefresh: false,
    })
}

async function withSyncMode<T>(mode: string, fn: () => Promise<T>): Promise<T> {
    process.env.AP_PIECES_SYNC_MODE = mode
    try {
        return await fn()
    }
    finally {
        process.env.AP_PIECES_SYNC_MODE = 'OFFICIAL_AUTO'
    }
}

async function mountAdminPlatformModule(): Promise<FastifyInstance> {
    const adminOnly = fastify({ loggerInstance: app.log })
    adminOnly.setValidatorCompiler(validatorCompiler)
    await adminOnly.register(adminPlatformModule, { prefix: '/api' })
    await adminOnly.ready()
    return adminOnly
}

async function loadSnapshot(): Promise<Record<string, string> | null> {
    return catalogSnapshotStore(app.log).load()
}

beforeAll(async () => {
    stubCloudFetch()
    app = await setupTestEnvironment({ fresh: true })
    entitledA = await createTestContext(app, { plan: { eventStreamingEnabled: true } })
    entitledB = await createTestContext(app, { plan: { eventStreamingEnabled: true } })
    unentitled = await createTestContext(app, { plan: { eventStreamingEnabled: false } })
    adminApp = system.getEdition() === ApEdition.CLOUD ? app : await mountAdminPlatformModule()
    await systemJobsQueue.removeJobScheduler(SystemJobName.PIECE_CATALOG_RECONCILE)
})

afterAll(async () => {
    vi.unstubAllGlobals()
    if (adminApp !== app) {
        await adminApp.close()
    }
    if (originalSyncMode === undefined) {
        delete process.env.AP_PIECES_SYNC_MODE
    }
    else {
        process.env.AP_PIECES_SYNC_MODE = originalSyncMode
    }
    await teardownTestEnvironment()
})

beforeEach(async () => {
    registry = []
    fetchDelayMs = 0
    pendingHooks = []
    const connection = databaseConnection()
    await connection.getRepository('piece_metadata').createQueryBuilder().delete().execute()
    await connection.getRepository('event_destination').createQueryBuilder().delete().execute()
    await connection.getRepository('flag').delete([SNAPSHOT_FLAG_ID])
    broadcastCalls = []
    beforeBroadcast = null
    vi.spyOn(eventDestinationsModule, 'eventDestinationService').mockImplementation((log) => {
        const real = originalEventDestinationService(log)
        return {
            ...real,
            broadcast: async (params) => {
                broadcastCalls.push(params.changes.map((change) => change.name))
                await beforeBroadcast?.()
                return real.broadcast(params)
            },
        }
    })
    addSpy = vi.fn<JobQueueAdd>()
    vi.spyOn(jobQueueModule, 'jobQueue').mockImplementation((log) => ({ ...originalJobQueue(log), add: addSpy }))
    vi.spyOn(catalogJobModule, 'pieceCatalogEventsJob').mockImplementation((log) => {
        const real = originalCatalogJob(log)
        const track = <T>(promise: Promise<T>): Promise<T> => {
            pendingHooks.push(promise.catch(() => undefined))
            return promise
        }
        return {
            ...real,
            enqueue: () => track(real.enqueue()),
            onSyncFinished: (params) => track(real.onSyncFinished(params)),
        }
    })
})

afterEach(async () => {
    await settleCatalogJobs()
    eventDestinationHooks.set(eventDestinationEntitlementHooks)
    vi.restoreAllMocks()
})

describe('Piece catalog events job', () => {
    it('S1 first sync of 30 pieces x 3 versions sends 0 events and seeds 30 entries', async () => {
        await subscribe({ platformId: entitledA.platform.id })
        await subscribe({ platformId: entitledB.platform.id })
        registry = baseCatalog()

        await sync()
        await settleCatalogJobs()

        expect(await databaseConnection().getRepository('piece_metadata').count()).toBe(90)
        expect(deliveries()).toHaveLength(0)
        const snapshot = await loadSnapshot()
        expect(Object.keys(snapshot ?? {})).toHaveLength(30)
        expect(snapshot?.['@test/piece-00']).toBe('1.0.0')
    })

    it('S2 a new piece after the seed sends 1 piece.created per subscribed platform', async () => {
        const destA = await subscribe({ platformId: entitledA.platform.id })
        const destB = await subscribe({ platformId: entitledB.platform.id })
        await seed(baseCatalog())
        registry = [...baseCatalog(), cloudPiece({ name: '@test/brand-new', version: '1.0.0' })]

        await sync()
        await settleCatalogJobs()

        for (const destinationId of [destA, destB]) {
            const received = deliveriesTo(destinationId)
            expect(received).toHaveLength(1)
            expect(received[0].event.action).toBe(ApplicationEventName.PIECE_CREATED)
            expect(received[0].event.data.piece).toMatchObject({ name: '@test/brand-new', version: '1.0.0', previousVersion: null, changeType: 'new' })
        }
        expect(deliveries()).toHaveLength(2)
        expect((await loadSnapshot())?.['@test/brand-new']).toBe('1.0.0')
    })

    it('S3 a bump 1.0.0 to 1.1.0 sends 1 piece.version.created with previousVersion', async () => {
        const destA = await subscribe({ platformId: entitledA.platform.id })
        await seed(baseCatalog())
        registry = [...baseCatalog(), cloudPiece({ name: '@test/piece-00', version: '1.1.0' })]

        await sync()
        await settleCatalogJobs()

        const received = deliveriesTo(destA)
        expect(received).toHaveLength(1)
        expect(received[0].event.action).toBe(ApplicationEventName.PIECE_VERSION_CREATED)
        expect(received[0].event.data.piece).toMatchObject({ name: '@test/piece-00', version: '1.1.0', previousVersion: '1.0.0', changeType: 'minor' })
        expect(received[0].event.projectId).toBeUndefined()
        expect(received[0].event.userId).toBeUndefined()
    })

    it('S4 a backfill of an older version sends 0', async () => {
        const destA = await subscribe({ platformId: entitledA.platform.id, changeTypes: ALL_CHANGE_TYPES })
        const withLatest = [...baseCatalog(), cloudPiece({ name: '@test/piece-00', version: '1.1.0' })]
        await seed(withLatest)
        registry = [...withLatest, cloudPiece({ name: '@test/piece-00', version: '1.0.5' })]

        await sync()
        await settleCatalogJobs()

        expect(await databaseConnection().getRepository('piece_metadata').countBy({ name: '@test/piece-00', version: '1.0.5' })).toBe(1)
        expect(deliveriesTo(destA)).toHaveLength(0)
        expect((await loadSnapshot())?.['@test/piece-00']).toBe('1.1.0')
    })

    it('S5 three versions in one run send 1 event from the snapshot version to the newest', async () => {
        const destA = await subscribe({ platformId: entitledA.platform.id, changeTypes: ALL_CHANGE_TYPES })
        const withLatest = [...baseCatalog(), cloudPiece({ name: '@test/piece-00', version: '1.1.0' })]
        await seed(withLatest)
        registry = [...withLatest, ...['1.1.1', '1.1.2', '1.1.3'].map((version) => cloudPiece({ name: '@test/piece-00', version }))]

        await sync()
        await settleCatalogJobs()

        const received = deliveriesTo(destA)
        expect(received).toHaveLength(1)
        expect(received[0].event.data.piece).toMatchObject({ previousVersion: '1.1.0', version: '1.1.3' })
    })

    it('S6 a stale delete then a re-add sends 0', async () => {
        const destA = await subscribe({ platformId: entitledA.platform.id, changeTypes: ALL_CHANGE_TYPES })
        const full = [...baseCatalog(), ...['1.1.0', '1.1.1', '1.1.2', '1.1.3'].map((version) => cloudPiece({ name: '@test/piece-00', version }))]
        await seed(full)
        registry = full.filter((piece) => !(piece.name === '@test/piece-00' && piece.version === '1.1.3'))
        await sync()
        await settleCatalogJobs()
        const rowsAfterDelete = await databaseConnection().getRepository('piece_metadata').countBy({ name: '@test/piece-00', version: '1.1.3' })

        registry = full
        await sync()
        await settleCatalogJobs()

        expect(rowsAfterDelete).toBe(0)
        expect(deliveriesTo(destA)).toHaveLength(0)
        expect((await loadSnapshot())?.['@test/piece-00']).toBe('1.1.3')
    })

    it('S7 two overlapping syncs announce each change once (5 rounds)', async () => {
        const destA = await subscribe({ platformId: entitledA.platform.id, changeTypes: ALL_CHANGE_TYPES })
        for (let round = 0; round < 5; round++) {
            await resetCatalog()
            await seed(baseCatalog())
            registry = [
                ...baseCatalog(),
                cloudPiece({ name: '@test/piece-00', version: '2.0.0' }),
                cloudPiece({ name: '@test/race-new', version: '1.0.0' }),
                cloudPiece({ name: '@test/piece-01', version: '1.0.1' }),
                cloudPiece({ name: '@test/piece-01', version: '1.0.2' }),
            ]

            await Promise.all([sync(), sync()])
            await settleCatalogJobs()

            const names = deliveriesTo(destA).map((delivery) => delivery.event.data.piece.name).sort()
            expect({ round, names }).toEqual({ round, names: ['@test/piece-00', '@test/piece-01', '@test/race-new'] })
        }
    })

    it('custom install sends nothing and writes nothing', async () => {
        const destA = await subscribe({ platformId: entitledA.platform.id, changeTypes: ALL_CHANGE_TYPES })
        const destB = await subscribe({ platformId: entitledB.platform.id, changeTypes: ALL_CHANGE_TYPES })
        await seed(baseCatalog())
        const snapshotBefore = await loadSnapshot()

        await installCustomPiece({ platformId: entitledA.platform.id, name: 'custom-x', version: '1.0.0' })
        await settleCatalogJobs()
        await runCatalogJob()

        expect(await databaseConnection().getRepository('piece_metadata').countBy({ name: 'custom-x', pieceType: PieceType.CUSTOM })).toBe(1)
        expect(addSpy).not.toHaveBeenCalled()
        expect(deliveriesTo(destA)).toHaveLength(0)
        expect(deliveriesTo(destB)).toHaveLength(0)
        expect(await loadSnapshot()).toEqual(snapshotBefore)
        expect(JSON.stringify(addSpy.mock.calls)).not.toContain('custom-x')
    })

    it('S9 a destination on every old event gets 0', async () => {
        const oldEvents = Object.values(ApplicationEventName).filter((event) => !PIECE_EVENTS.includes(event))
        const destA = await subscribe({ platformId: entitledA.platform.id, events: oldEvents, changeTypes: ALL_CHANGE_TYPES })
        await seed(baseCatalog())
        registry = [...baseCatalog(), cloudPiece({ name: '@test/piece-00', version: '1.1.0' }), cloudPiece({ name: '@test/brand-new', version: '1.0.0' })]

        await sync()
        await settleCatalogJobs()

        expect(oldEvents.length).toBeGreaterThan(0)
        expect(oldEvents).not.toContain(ApplicationEventName.PIECE_CREATED)
        expect(oldEvents).not.toContain(ApplicationEventName.PIECE_VERSION_CREATED)
        expect(deliveriesTo(destA)).toHaveLength(0)
        expect((await loadSnapshot())?.['@test/brand-new']).toBe('1.0.0')
    })

    it('S10 a platform without eventStreamingEnabled gets 0', async () => {
        const destUnentitled = await subscribe({ platformId: unentitled.platform.id })
        const destControl = await subscribe({ platformId: entitledA.platform.id })
        await seed(baseCatalog())
        registry = [...baseCatalog(), cloudPiece({ name: '@test/piece-00', version: '1.1.0' })]

        await sync()
        await settleCatalogJobs()

        expect(deliveriesTo(destUnentitled)).toHaveLength(0)
        expect(deliveriesTo(destControl)).toHaveLength(1)
    })

    it('S11 the seed path never broadcasts while the entitlement hook is at its default', async () => {
        const destUnentitled = await subscribe({ platformId: unentitled.platform.id })
        const destControl = await subscribe({ platformId: entitledA.platform.id })
        eventDestinationHooks.set(() => ({ isDeliveryEntitled: async () => true, listDeliveryEntitledPlatformIds: async ({ platformIds }) => platformIds }))
        registry = baseCatalog()
        await sync()
        await settleCatalogJobs()
        const broadcastsInBootWindow = broadcastCalls.length
        const deliveriesInBootWindow = deliveries().length

        eventDestinationHooks.set(eventDestinationEntitlementHooks)
        registry = [...baseCatalog(), cloudPiece({ name: '@test/piece-00', version: '1.1.0' })]
        await sync()
        await settleCatalogJobs()

        expect(Object.keys(await loadSnapshot() ?? {})).toHaveLength(30)
        expect(broadcastsInBootWindow).toBe(0)
        expect(deliveriesInBootWindow).toBe(0)
        expect(deliveriesTo(destUnentitled)).toHaveLength(0)
        expect(deliveriesTo(destControl)).toHaveLength(1)
    })

    it('S12 60 admin publishes in 2 batches send 60 jobs per destination with 1 fan-out per run', async () => {
        const destA = await subscribe({ platformId: entitledA.platform.id, changeTypes: ALL_CHANGE_TYPES })
        const destB = await subscribe({ platformId: entitledB.platform.id, changeTypes: ALL_CHANGE_TYPES })
        const names = Array.from({ length: 60 }, (_, index) => `@test/bulk-${String(index).padStart(2, '0')}`)
        for (const name of names) {
            await insertOfficialPiece({ name, version: '1.0.0' })
        }
        await catalogJobModule.pieceCatalogEventsJob(app.log).onSyncFinished({ added: 0, deleted: 0, fetchFailed: 0 })
        const diffSpy = vi.spyOn(catalogDiffModule, 'diffCatalog')

        const firstBatch = await Promise.all(names.slice(0, 30).map((name) => adminPublish({ name, version: '1.0.1' })))
        await sleep(500)
        const secondBatch = await Promise.all(names.slice(30).map((name) => adminPublish({ name, version: '1.0.1' })))
        await settleCatalogJobs()

        expect(new Set([...firstBatch, ...secondBatch])).toEqual(new Set([200]))
        for (const destinationId of [destA, destB]) {
            const received = deliveriesTo(destinationId)
            expect(received).toHaveLength(60)
            expect(new Set(received.map((delivery) => delivery.event.data.piece.name)).size).toBe(60)
        }
        const announced = broadcastCalls.flat()
        expect(announced).toHaveLength(60)
        expect(new Set(announced).size).toBe(60)
        expect(broadcastCalls.length).toBeLessThanOrEqual(diffSpy.mock.calls.length)
        expect(broadcastCalls.length).toBeLessThan(60)
    })

    it('S15 an admin publish while the job is running is announced by the follow-up job', async () => {
        const destA = await subscribe({ platformId: entitledA.platform.id, changeTypes: ALL_CHANGE_TYPES })
        await seed(baseCatalog())
        let releaseBroadcast: () => void = () => undefined
        const broadcastGate = new Promise<void>((resolve) => {
            releaseBroadcast = resolve
        })
        let markEntered: () => void = () => undefined
        const broadcastEntered = new Promise<void>((resolve) => {
            markEntered = resolve
        })
        beforeBroadcast = async () => {
            markEntered()
            await broadcastGate
        }
        registry = [...baseCatalog(), cloudPiece({ name: '@test/piece-00', version: '1.1.0' })]
        await sync()
        await broadcastEntered
        const baseStateDuringRun = await systemJobsSchedule(app.log).getJobState('piece-catalog-events')

        const status = await adminPublish({ name: '@test/piece-01', version: '1.1.0' })
        await Promise.all(pendingHooks)
        const followUp = await systemJobsSchedule(app.log).getJob('piece-catalog-events-follow-up')
        beforeBroadcast = null
        releaseBroadcast()
        await settleCatalogJobs()

        expect(baseStateDuringRun).toBe('active')
        expect(status).toBe(200)
        expect(followUp).toBeDefined()
        expect(broadcastCalls).toEqual([['@test/piece-00'], ['@test/piece-01']])
        expect(deliveriesTo(destA).map((delivery) => delivery.event.data.piece.name).sort()).toEqual(['@test/piece-00', '@test/piece-01'])
    })

    it('S16 triggers at 5 of 90 official rows mid first sync write no snapshot and send no false piece.created', async () => {
        const destA = await subscribe({ platformId: entitledA.platform.id, changeTypes: ALL_CHANGE_TYPES })
        registry = baseCatalog()
        fetchDelayMs = 100
        const officialRows = async (): Promise<number> => databaseConnection().getRepository('piece_metadata').countBy({ pieceType: PieceType.OFFICIAL })
        const syncPromise = sync()
        const deadline = Date.now() + 20_000
        while (await officialRows() < 5 && Date.now() < deadline) {
            await sleep(20)
        }

        await runCatalogJob()
        await installCustomPiece({ platformId: entitledA.platform.id, name: 'custom-mid', version: '1.0.0' })
        reportPiecesSyncRunning()
        await runReconcileJob()
        const rowsAtCheckpoint = await officialRows()
        const snapshotMidSync = await loadSnapshot()
        await syncPromise
        fetchDelayMs = 0
        await settleCatalogJobs()

        expect(rowsAtCheckpoint).toBeGreaterThanOrEqual(5)
        expect(rowsAtCheckpoint).toBeLessThan(90)
        expect(snapshotMidSync).toBeNull()
        expect(broadcastCalls).toHaveLength(0)
        expect(deliveriesTo(destA)).toHaveLength(0)
        expect(Object.keys(await loadSnapshot() ?? {})).toHaveLength(30)
    })

    it('the reconcile does not seed mid boot sync when no pieces sync job is queued', async () => {
        const destA = await subscribe({ platformId: entitledA.platform.id, changeTypes: ALL_CHANGE_TYPES })
        registry = baseCatalog()
        fetchDelayMs = 100
        const officialRows = async (): Promise<number> => databaseConnection().getRepository('piece_metadata').countBy({ pieceType: PieceType.OFFICIAL })
        const syncPromise = sync()
        const deadline = Date.now() + 20_000
        while (await officialRows() < 5 && Date.now() < deadline) {
            await sleep(20)
        }

        await runReconcileJob()
        const rowsAtCheckpoint = await officialRows()
        const snapshotMidSync = await loadSnapshot()
        await syncPromise
        fetchDelayMs = 0
        await settleCatalogJobs()

        expect(rowsAtCheckpoint).toBeGreaterThanOrEqual(5)
        expect(rowsAtCheckpoint).toBeLessThan(90)
        expect(snapshotMidSync).toBeNull()
        expect(deliveriesTo(destA)).toHaveLength(0)
        expect(Object.keys(await loadSnapshot() ?? {})).toHaveLength(30)
    })

    it('a running sync left by a crashed replica stops blocking the reconcile seed after two hours', async () => {
        await insertOfficialPiece({ name: '@test/auto-a', version: '1.0.0' })
        await catalogJobModule.pieceCatalogEventsJob(app.log).onSyncStarted()

        await runReconcileJob()
        const snapshotWhileRunning = await loadSnapshot()
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(Date.now() + 2 * 60 * 60 * 1000 + 1000)
        await runReconcileJob()
        vi.useRealTimers()

        expect(snapshotWhileRunning).toBeNull()
        expect(await loadSnapshot()).toEqual({ '@test/auto-a': '1.0.0' })
    })

    it('S17 AP_PIECES_SYNC_MODE=NONE: the boot seed sends 0, then a bump and a new piece via admin POST send exactly 2', async () => {
        const destA = await subscribe({ platformId: entitledA.platform.id })
        await withSyncMode('NONE', async () => {
            await insertOfficialPiece({ name: '@test/none-a', version: '1.0.0' })
            await insertOfficialPiece({ name: '@test/none-b', version: '1.0.0' })

            await catalogJobModule.pieceCatalogEventsJob(app.log).seedAtBootIfSyncOff()
            const snapshotAfterBoot = await loadSnapshot()
            const deliveriesFromSeed = deliveries().length

            const statuses = [
                await adminPublish({ name: '@test/none-a', version: '1.1.0' }),
                await adminPublish({ name: '@test/none-c', version: '1.0.0' }),
            ]
            await settleCatalogJobs()

            expect(snapshotAfterBoot).toEqual({ '@test/none-a': '1.0.0', '@test/none-b': '1.0.0' })
            expect(deliveriesFromSeed).toBe(0)
            expect(statuses).toEqual([200, 200])
            const announced = deliveriesTo(destA).map(({ event }) => `${event.action} ${event.data.piece.name} ${event.data.piece.previousVersion ?? '-'}->${event.data.piece.version}`).sort()
            expect(announced).toEqual([
                'piece.created @test/none-c -->1.0.0',
                'piece.version.created @test/none-a 1.0.0->1.1.0',
            ])
        })
    })

    it('concurrent boot seeds write one snapshot', async () => {
        const snapshotSaves: unknown[] = []
        vi.spyOn(flagServiceModule, 'flagService').mockImplementation((log) => {
            const real = originalFlagService(log)
            return {
                ...real,
                save: async (flag) => {
                    if (flag.id === SNAPSHOT_FLAG_ID) {
                        snapshotSaves.push(flag.value)
                    }
                    return real.save(flag)
                },
            }
        })
        await withSyncMode('NONE', async () => {
            await insertOfficialPiece({ name: '@test/boot-a', version: '1.0.0' })
            await insertOfficialPiece({ name: '@test/boot-b', version: '2.0.0' })

            await Promise.all([
                catalogJobModule.pieceCatalogEventsJob(app.log).seedAtBootIfSyncOff(),
                catalogJobModule.pieceCatalogEventsJob(app.log).seedAtBootIfSyncOff(),
            ])
        })

        expect(snapshotSaves).toEqual([{ '@test/boot-a': '1.0.0', '@test/boot-b': '2.0.0' }])
        expect(addSpy).not.toHaveBeenCalled()
        expect(broadcastCalls).toHaveLength(0)
    })

    it('the reconcile job seeds when sync is off, then announces a change no hook reported', async () => {
        const destA = await subscribe({ platformId: entitledA.platform.id })
        await withSyncMode('NONE', async () => {
            await insertOfficialPiece({ name: '@test/quiet', version: '1.0.0' })
            await runReconcileJob()
            const deliveriesAfterSeed = deliveries().length

            await insertOfficialPiece({ name: '@test/quiet', version: '2.0.0' })
            await runReconcileJob()

            expect(deliveriesAfterSeed).toBe(0)
        })
        const received = deliveriesTo(destA)
        expect(received).toHaveLength(1)
        expect(received[0].event.data.piece).toMatchObject({ name: '@test/quiet', previousVersion: '1.0.0', version: '2.0.0', changeType: 'major' })
    })

    it('boot seed failure does not reject', async () => {
        vi.spyOn(flagServiceModule, 'flagService').mockImplementation((log) => ({
            ...originalFlagService(log),
            save: async () => {
                throw new Error('snapshot write refused')
            },
        }))
        await withSyncMode('NONE', async () => {
            await insertOfficialPiece({ name: '@test/boot-fail', version: '1.0.0' })

            await expect(catalogJobModule.pieceCatalogEventsJob(app.log).seedAtBootIfSyncOff()).resolves.toBeUndefined()
        })
        vi.mocked(flagServiceModule.flagService).mockImplementation(originalFlagService)

        expect(await databaseConnection().getRepository('flag').countBy({ id: SNAPSHOT_FLAG_ID })).toBe(0)
    })

    it('reconcile seeds when the boot seed was skipped', async () => {
        await subscribe({ platformId: entitledA.platform.id, changeTypes: ALL_CHANGE_TYPES })
        await withSyncMode('NONE', async () => {
            await insertOfficialPiece({ name: '@test/late-seed', version: '1.0.0' })
            expect(await databaseConnection().getRepository('flag').countBy({ id: SNAPSHOT_FLAG_ID })).toBe(0)

            await runReconcileJob()
        })

        expect(await loadSnapshot()).toEqual({ '@test/late-seed': '1.0.0' })
        expect(addSpy).not.toHaveBeenCalled()
        expect(broadcastCalls).toHaveLength(0)
    })

    it('scheduleReconcile registers an hourly UTC scheduler at minute 45', async () => {
        await catalogJobModule.pieceCatalogEventsJob(app.log).scheduleReconcile()
        const schedulers = await systemJobsQueue.getJobSchedulers()
        await systemJobsQueue.removeJobScheduler(SystemJobName.PIECE_CATALOG_RECONCILE)

        const reconcile = schedulers.filter((scheduler) => scheduler.name === SystemJobName.PIECE_CATALOG_RECONCILE)
        expect(reconcile).toHaveLength(1)
        expect(reconcile[0]).toMatchObject({ pattern: '45 * * * *', tz: 'UTC' })
    })

    it('job throws when the snapshot save fails', async () => {
        await subscribe({ platformId: entitledA.platform.id })
        await seed(baseCatalog())
        await insertOfficialPiece({ name: '@test/piece-00', version: '1.1.0' })
        vi.spyOn(flagServiceModule, 'flagService').mockImplementation((log) => ({
            ...originalFlagService(log),
            save: async () => {
                throw new Error('snapshot write refused')
            },
        }))

        await expect(runCatalogJob()).rejects.toThrow('snapshot write refused')
        vi.mocked(flagServiceModule.flagService).mockImplementation(originalFlagService)

        expect((await loadSnapshot())?.['@test/piece-00']).toBe('1.0.0')
    })

    it('a failed run does not block the next enqueue', async () => {
        const destA = await subscribe({ platformId: entitledA.platform.id })
        await seed(baseCatalog())
        let failNextBroadcast = true
        vi.spyOn(eventDestinationsModule, 'eventDestinationService').mockImplementation((log) => {
            const real = originalEventDestinationService(log)
            return {
                ...real,
                broadcast: async (params) => {
                    if (failNextBroadcast) {
                        failNextBroadcast = false
                        return { queued: 0, failedPlatformIds: ['p_bad'] }
                    }
                    return real.broadcast(params)
                },
            }
        })
        await insertOfficialPiece({ name: '@test/piece-00', version: '1.1.0' })
        await catalogJobModule.pieceCatalogEventsJob(app.log).enqueue()
        const stateAfterFailure = await waitForJobState('piece-catalog-events', 'failed')

        await insertOfficialPiece({ name: '@test/piece-01', version: '1.1.0' })
        await catalogJobModule.pieceCatalogEventsJob(app.log).enqueue()
        const stateAfterNextRun = await waitForJobState('piece-catalog-events', 'unknown')
        await settleCatalogJobs()

        expect(stateAfterFailure).toBe('failed')
        expect(stateAfterNextRun).toBe('unknown')
        expect(deliveriesTo(destA).map((delivery) => delivery.event.data.piece.name)).toEqual(['@test/piece-01'])
    })

    it('reconcile seeds an OFFICIAL_AUTO instance when no clean sync ever finishes', async () => {
        await subscribe({ platformId: entitledA.platform.id, changeTypes: ALL_CHANGE_TYPES })
        await insertOfficialPiece({ name: '@test/auto-a', version: '1.0.0' })
        await insertOfficialPiece({ name: '@test/auto-b', version: '2.0.0' })
        await catalogJobModule.pieceCatalogEventsJob(app.log).onSyncFinished({ added: 1, deleted: 0, fetchFailed: 1 })
        await settleCatalogJobs()
        const snapshotAfterFailedSync = await loadSnapshot()
        addSpy.mockClear()

        await runReconcileJob()

        expect(snapshotAfterFailedSync).toBeNull()
        expect(await loadSnapshot()).toEqual({ '@test/auto-a': '1.0.0', '@test/auto-b': '2.0.0' })
        expect(addSpy).not.toHaveBeenCalled()
        expect(broadcastCalls).toHaveLength(0)
    })

    it('reconcile does not seed an OFFICIAL_AUTO instance while a pieces sync job is running', async () => {
        await insertOfficialPiece({ name: '@test/auto-a', version: '1.0.0' })
        reportPiecesSyncRunning()

        await runReconcileJob()

        expect(await loadSnapshot()).toBeNull()
        expect(addSpy).not.toHaveBeenCalled()
    })

    it('reconcile seeds an OFFICIAL_AUTO instance when a job finishes while the active list is read', async () => {
        await insertOfficialPiece({ name: '@test/auto-a', version: '1.0.0' })
        vi.spyOn(systemJobsQueue, 'getActive').mockResolvedValue([undefined] as unknown as Awaited<ReturnType<typeof systemJobsQueue.getActive>>)

        await runReconcileJob()

        expect(await loadSnapshot()).toEqual({ '@test/auto-a': '1.0.0' })
        expect(addSpy).not.toHaveBeenCalled()
    })

    it('reconcile treats an unreadable pieces sync state as running and skips the auto seed', async () => {
        await insertOfficialPiece({ name: '@test/auto-a', version: '1.0.0' })
        vi.spyOn(systemJobsQueue, 'getActive').mockRejectedValue(new Error('redis unavailable'))

        await runReconcileJob()

        expect(await loadSnapshot()).toBeNull()
        expect(addSpy).not.toHaveBeenCalled()
    })

    it('an OFFICIAL row scoped to a platform is never announced and never enters the snapshot', async () => {
        const destA = await subscribe({ platformId: entitledA.platform.id, changeTypes: ALL_CHANGE_TYPES })
        await seed(baseCatalog())
        const snapshotBefore = await loadSnapshot()
        await insertOfficialPiece({ name: '@test/piece-00', version: '9.0.0', platformId: entitledA.platform.id })
        await insertOfficialPiece({ name: '@test/platform-scoped', version: '1.0.0', platformId: entitledA.platform.id })

        await runCatalogJob()

        expect(broadcastCalls).toHaveLength(0)
        expect(deliveriesTo(destA)).toHaveLength(0)
        expect(await loadSnapshot()).toEqual(snapshotBefore)
    })

    it('seeding skips the catalog lock once a snapshot exists', async () => {
        await seed(baseCatalog())
        const snapshotBefore = await loadSnapshot()
        const lockKeys: string[] = []
        const originalDistributedLock = redisConnectionsModule.distributedLock
        vi.spyOn(redisConnectionsModule, 'distributedLock').mockImplementation((log) => {
            const real = originalDistributedLock(log)
            return {
                ...real,
                runExclusive: (params) => {
                    lockKeys.push(params.key)
                    return real.runExclusive(params)
                },
            }
        })

        await withSyncMode('NONE', async () => catalogJobModule.pieceCatalogEventsJob(app.log).seedAtBootIfSyncOff())
        await catalogJobModule.pieceCatalogEventsJob(app.log).onSyncFinished({ added: 0, deleted: 0, fetchFailed: 0 })

        expect(lockKeys).not.toContain('piece-catalog-events')
        expect(await loadSnapshot()).toEqual(snapshotBefore)
    })

    it('job saves the snapshot then throws when one platform fails', async () => {
        await seed(baseCatalog())
        await insertOfficialPiece({ name: '@test/piece-00', version: '1.1.0' })
        vi.spyOn(eventDestinationsModule, 'eventDestinationService').mockImplementation((log) => ({
            ...originalEventDestinationService(log),
            broadcast: async () => ({ queued: 1, failedPlatformIds: ['p_bad'] }),
        }))

        const rejection = await runCatalogJob().then(() => null, (error: unknown) => error)

        expect(rejection).toBeInstanceOf(UnrecoverableError)
        expect((rejection as Error).message).toContain('p_bad')
        const snapshot = await loadSnapshot()
        expect(Object.keys(snapshot ?? {})).toHaveLength(30)
        expect(snapshot?.['@test/piece-00']).toBe('1.1.0')
    })
})

type JobQueueAdd = ReturnType<typeof jobQueueModule.jobQueue>['add']

type QueuedJob = {
    data: {
        jobType: WorkerJobType
        webhookId: string
        payload: Delivery['event']
    }
}

type SubscribeParams = {
    platformId: string
    events?: ApplicationEventName[]
    changeTypes?: PieceChangeType[]
}

type CloudPiece = Record<string, unknown> & { id: string, name: string, version: string }

type Delivery = {
    destinationId: string
    event: {
        action: ApplicationEventName
        projectId?: string
        userId?: string
        data: { piece: { name: string, version: string, previousVersion: string | null, changeType: string } }
    }
}
