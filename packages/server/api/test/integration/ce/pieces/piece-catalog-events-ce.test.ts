import { apId } from '@activepieces/core-utils'
import { ApplicationEventName, EventDestinationScope, PackageType, PieceChangeType, PieceType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { Mock } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import * as eventDestinationsModule from '../../../../src/app/event-destinations/event-destinations.service'
import { SystemJobName } from '../../../../src/app/helper/system-jobs/common'
import { systemJobHandlers } from '../../../../src/app/helper/system-jobs/job-handlers'
import * as systemJobModule from '../../../../src/app/helper/system-jobs/system-job'
import { pieceMetadataService } from '../../../../src/app/pieces/metadata/piece-metadata-service'
import { catalogSnapshotStore } from '../../../../src/app/pieces/piece-catalog/catalog-snapshot-store'
import * as catalogJobModule from '../../../../src/app/pieces/piece-catalog/piece-catalog-events.job'
import { pieceSyncService } from '../../../../src/app/pieces/piece-sync-service'
import * as jobQueueModule from '../../../../src/app/workers/job-queue/job-queue'
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
const SNAPSHOT_FLAG_ID = 'PIECE_CATALOG_SNAP'
const CATALOG_JOB_IDS = ['piece-catalog-events', 'piece-catalog-events-follow-up']
const CATALOG_JOB_NAMES: string[] = [SystemJobName.PIECE_CATALOG_EVENTS, SystemJobName.PIECE_CATALOG_RECONCILE]
const ALL_CHANGE_TYPES: PieceChangeType[] = ['new', 'major', 'minor', 'patch']

let app: FastifyInstance
let ctx: TestContext
let registry: CloudPiece[] = []
let bootReconcileSchedulers: string[] = []
let pendingHooks: Promise<unknown>[] = []
let upsertedJobNames: string[] = []
let addSpy: Mock<JobQueueAdd>
let broadcastSpy: Mock<Broadcast>
const originalJobQueue = jobQueueModule.jobQueue
const originalCatalogJob = catalogJobModule.pieceCatalogEventsJob
const originalSystemJobsSchedule = systemJobModule.systemJobsSchedule
const originalEventDestinationService = eventDestinationsModule.eventDestinationService

function cloudPiece({ name, version }: { name: string, version: string }): CloudPiece {
    const isoNow = new Date().toISOString()
    return {
        id: apId(),
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
        if (url.pathname === '/api/v1/pieces/registry') {
            return jsonResponse(registry.map((piece) => ({ name: piece.name, version: piece.version })))
        }
        const name = decodeURIComponent(url.pathname.slice('/api/v1/pieces/'.length))
        const version = url.searchParams.get('version')
        const match = registry.find((piece) => piece.name === name && piece.version === version)
        return match ? jsonResponse(match) : jsonResponse({ message: 'not found' }, 404)
    })
}

async function sync(): Promise<void> {
    await pieceSyncService(app.log).sync({ publishCacheRefresh: false })
    await settleHooks()
}

async function settleHooks(): Promise<void> {
    while (pendingHooks.length > 0) {
        const hooks = pendingHooks
        pendingHooks = []
        await Promise.all(hooks)
    }
}

async function subscribe(): Promise<void> {
    await db.save('event_destination', createMockEventDestination({
        platformId: ctx.platform.id,
        events: [ApplicationEventName.PIECE_CREATED, ApplicationEventName.PIECE_VERSION_CREATED],
        scope: EventDestinationScope.PLATFORM,
        url: `https://collector.example.com/${apId()}`,
        eventFilters: { piece: { changeTypes: ALL_CHANGE_TYPES } },
    }))
}

async function insertOfficialPiece({ name, version }: { name: string, version: string }): Promise<void> {
    await pieceMetadataService(app.log).create({
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

async function reconcileSchedulerIds(): Promise<string[]> {
    const schedulers = await systemJobModule.systemJobsQueue.getJobSchedulers()
    return schedulers
        .filter((scheduler) => scheduler.name === SystemJobName.PIECE_CATALOG_RECONCILE)
        .map((scheduler) => scheduler.id ?? scheduler.key)
}

async function expectNoCatalogJobs(): Promise<void> {
    const jobs = await Promise.all(CATALOG_JOB_IDS.map((jobId) => systemJobModule.systemJobsSchedule(app.log).getJob(jobId)))
    expect(jobs).toEqual([undefined, undefined])
    expect(await reconcileSchedulerIds()).toEqual([])
    expect(upsertedJobNames.filter((name) => CATALOG_JOB_NAMES.includes(name))).toEqual([])
}

async function expectNoDeliveries(): Promise<void> {
    expect(broadcastSpy).not.toHaveBeenCalled()
    expect(addSpy).not.toHaveBeenCalled()
}

beforeAll(async () => {
    stubCloudFetch()
    app = await setupTestEnvironment({ fresh: true })
    ctx = await createTestContext(app, { plan: { eventStreamingEnabled: true } })
    bootReconcileSchedulers = await reconcileSchedulerIds()
    await systemJobModule.systemJobsQueue.removeJobScheduler(SystemJobName.PIECE_CATALOG_RECONCILE)
})

afterAll(async () => {
    vi.unstubAllGlobals()
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
    pendingHooks = []
    upsertedJobNames = []
    const connection = databaseConnection()
    await connection.getRepository('piece_metadata').createQueryBuilder().delete().execute()
    await connection.getRepository('event_destination').createQueryBuilder().delete().execute()
    await connection.getRepository('flag').delete([SNAPSHOT_FLAG_ID])
    addSpy = vi.fn<JobQueueAdd>()
    vi.spyOn(jobQueueModule, 'jobQueue').mockImplementation((log) => ({ ...originalJobQueue(log), add: addSpy }))
    broadcastSpy = vi.fn<Broadcast>()
    vi.spyOn(eventDestinationsModule, 'eventDestinationService').mockImplementation((log) => {
        const real = originalEventDestinationService(log)
        broadcastSpy.mockImplementation((params) => real.broadcast(params))
        return { ...real, broadcast: broadcastSpy }
    })
    vi.spyOn(systemJobModule, 'systemJobsSchedule').mockImplementation((log) => {
        const real = originalSystemJobsSchedule(log)
        return {
            ...real,
            upsertJob: async (params): ReturnType<typeof real.upsertJob> => {
                upsertedJobNames.push(params.job.name)
                return real.upsertJob(params)
            },
        }
    })
    vi.spyOn(catalogJobModule, 'pieceCatalogEventsJob').mockImplementation((log) => {
        const real = originalCatalogJob(log)
        const track = <T>(promise: Promise<T>): Promise<T> => {
            pendingHooks.push(promise.catch(() => undefined))
            return promise
        }
        return {
            ...real,
            enqueue: (): Promise<void> => track(real.enqueue()),
            onSyncFinished: (params): Promise<void> => track(real.onSyncFinished(params)),
        }
    })
})

afterEach(async () => {
    await settleHooks()
    vi.restoreAllMocks()
})

describe('Piece catalog events in community edition', () => {
    it('boot schedules no catalog reconcile and seeds no snapshot', async () => {
        expect(bootReconcileSchedulers).toEqual([])
        expect(await catalogSnapshotStore(app.log).load()).toBeNull()
        await expectNoCatalogJobs()
    })

    it('piece sync still installs pieces and sends no events', async () => {
        await subscribe()
        registry = ['@test/piece-a', '@test/piece-b', '@test/piece-c'].flatMap((name) => ['0.1.0', '1.0.0'].map((version) => cloudPiece({ name, version })))

        await sync()
        registry = [...registry, cloudPiece({ name: '@test/piece-a', version: '2.0.0' }), cloudPiece({ name: '@test/piece-d', version: '0.1.0' })]
        await sync()

        expect(await databaseConnection().getRepository('piece_metadata').count()).toBe(8)
        expect(await catalogSnapshotStore(app.log).load()).toBeNull()
        await expectNoCatalogJobs()
        await expectNoDeliveries()
    })

    it('every job entry point returns without a job, a snapshot or a delivery', async () => {
        await subscribe()
        await insertOfficialPiece({ name: '@test/piece-a', version: '1.0.0' })
        const job = catalogJobModule.pieceCatalogEventsJob(app.log)

        const runningSyncId = await job.onSyncStarted()
        await job.onSyncStopped(runningSyncId)
        await job.onSyncFinished({ added: 1, deleted: 0, fetchFailed: 0 })
        await job.enqueue()
        await job.scheduleReconcile()
        await withSyncMode('NONE', () => job.seedAtBootIfSyncOff())
        await job.seedAtBootIfSyncOff()

        expect(runningSyncId).toBeNull()
        expect(await catalogSnapshotStore(app.log).load()).toBeNull()
        await expectNoCatalogJobs()
        await expectNoDeliveries()
    })

    it('the registered catalog handlers neither seed nor diff nor broadcast', async () => {
        await subscribe()
        await insertOfficialPiece({ name: '@test/piece-a', version: '1.0.0' })
        await insertOfficialPiece({ name: '@test/piece-b', version: '0.1.0' })
        const reconcile = systemJobHandlers.getJobHandler(SystemJobName.PIECE_CATALOG_RECONCILE)
        const runEvents = systemJobHandlers.getJobHandler(SystemJobName.PIECE_CATALOG_EVENTS)

        await expect(reconcile({})).resolves.toBeUndefined()
        await expect(withSyncMode('NONE', () => reconcile({}))).resolves.toBeUndefined()
        expect(await catalogSnapshotStore(app.log).load()).toBeNull()

        const staleSnapshot = { '@test/piece-a': '0.1.0' }
        await catalogSnapshotStore(app.log).save(staleSnapshot)
        await expect(runEvents({})).resolves.toBeUndefined()
        await expect(reconcile({})).resolves.toBeUndefined()

        expect(await catalogSnapshotStore(app.log).load()).toEqual(staleSnapshot)
        await expectNoCatalogJobs()
        await expectNoDeliveries()
    })
})

type JobQueueAdd = ReturnType<typeof jobQueueModule.jobQueue>['add']

type Broadcast = ReturnType<typeof eventDestinationsModule.eventDestinationService>['broadcast']

type CloudPiece = Record<string, unknown> & { id: string, name: string, version: string }
