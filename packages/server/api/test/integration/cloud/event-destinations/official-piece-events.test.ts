import { apId } from '@activepieces/core-utils'
import { ApEdition, ApplicationEventName, EventDestinationScope, PackageType, PieceType, WorkerJobType } from '@activepieces/shared'
import fastify, { FastifyInstance } from 'fastify'
import { validatorCompiler } from 'fastify-type-provider-zod'
import { Repository } from 'typeorm'
import { Mock } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { redisConnections } from '../../../../src/app/database/redis-connections'
import { adminPlatformModule } from '../../../../src/app/ee/platform/admin/admin-platform.controller'
import * as eventDestinationsModule from '../../../../src/app/event-destinations/event-destinations.service'
import { system } from '../../../../src/app/helper/system/system'
import { pieceMetadataService } from '../../../../src/app/pieces/metadata/piece-metadata-service'
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
const PIECE_EVENTS = [
    ApplicationEventName.OFFICIAL_PIECE_ADDED,
    ApplicationEventName.OFFICIAL_PIECE_MINOR_OR_MAJOR_VERSION_ADDED,
    ApplicationEventName.OFFICIAL_PIECE_PATCH_VERSION_ADDED,
]

let app: FastifyInstance
let adminApp: FastifyInstance
let entitledA: TestContext
let entitledB: TestContext
let unentitled: TestContext
let registry: CloudPiece[] = []
let addSpy: Mock<JobQueueAdd>
let pendingSends: Promise<unknown>[] = []
const originalJobQueue = jobQueueModule.jobQueue
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

async function settleSends(): Promise<void> {
    while (pendingSends.length > 0) {
        const sends = pendingSends
        pendingSends = []
        await Promise.all(sends)
    }
}

async function sync(pieces: { name: string, version: string }[]): Promise<void> {
    registry = [...registry, ...pieces.map(cloudPiece)]
    await pieceSyncService(app.log).sync({ publishCacheRefresh: false })
    await settleSends()
}

async function seed(pieces: { name: string, version: string }[]): Promise<void> {
    await sync(pieces)
    addSpy.mockClear()
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
    await settleSends()
    return response.statusCode
}

async function subscribe({ platformId, events = PIECE_EVENTS }: SubscribeParams): Promise<string> {
    const destination = createMockEventDestination({
        platformId,
        events,
        scope: EventDestinationScope.PLATFORM,
        url: `https://collector.example.com/${apId()}`,
    })
    await db.save('event_destination', destination)
    return destination.id
}

function deliveries(): Delivery[] {
    return addSpy.mock.calls
        .map((call) => call[0] as unknown as QueuedJob)
        .filter((job) => job.data.jobType === WorkerJobType.EVENT_DESTINATION)
        .map((job) => ({ destinationId: job.data.webhookId, event: job.data.payload }))
}

function deliveriesTo(destinationId: string): Delivery[] {
    return deliveries().filter((delivery) => delivery.destinationId === destinationId)
}

async function mountAdminPlatformModule(): Promise<FastifyInstance> {
    const adminOnly = fastify({ loggerInstance: app.log })
    adminOnly.setValidatorCompiler(validatorCompiler)
    await adminOnly.register(adminPlatformModule, { prefix: '/api' })
    await adminOnly.ready()
    return adminOnly
}

beforeAll(async () => {
    stubCloudFetch()
    app = await setupTestEnvironment({ fresh: true })
    entitledA = await createTestContext(app, { plan: { eventStreamingEnabled: true } })
    entitledB = await createTestContext(app, { plan: { eventStreamingEnabled: true } })
    unentitled = await createTestContext(app, { plan: { eventStreamingEnabled: false } })
    adminApp = system.getEdition() === ApEdition.CLOUD ? app : await mountAdminPlatformModule()
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
    pendingSends = []
    const connection = databaseConnection()
    await connection.getRepository('piece_metadata').createQueryBuilder().delete().execute()
    await connection.getRepository('event_destination').createQueryBuilder().delete().execute()
    const redis = await redisConnections.useExisting()
    const claimKeys = await redis.keys('official-piece-added:*')
    if (claimKeys.length > 0) {
        await redis.del(...claimKeys)
    }
    addSpy = vi.fn<JobQueueAdd>()
    vi.spyOn(jobQueueModule, 'jobQueue').mockImplementation((log) => ({ ...originalJobQueue(log), add: addSpy }))
    vi.spyOn(eventDestinationsModule, 'eventDestinationService').mockImplementation((log) => {
        const real = originalEventDestinationService(log)
        return {
            ...real,
            triggerOnAllPlatforms: (params) => {
                const promise = real.triggerOnAllPlatforms(params)
                pendingSends.push(promise.catch(() => undefined))
                return promise
            },
        }
    })
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('Official piece events', () => {
    it('a sync that adds a new piece sends official_piece.added to every subscribed platform with event streaming', async () => {
        const destinationA = await subscribe({ platformId: entitledA.platform.id })
        const destinationB = await subscribe({ platformId: entitledB.platform.id })
        const destinationUnentitled = await subscribe({ platformId: unentitled.platform.id })

        await sync([{ name: '@test/new-piece', version: '1.0.0' }])

        for (const destinationId of [destinationA, destinationB]) {
            const sent = deliveriesTo(destinationId)
            expect(sent).toHaveLength(1)
            expect(sent[0].event.action).toBe(ApplicationEventName.OFFICIAL_PIECE_ADDED)
            expect(sent[0].event.data.piece).toMatchObject({
                name: '@test/new-piece',
                version: '1.0.0',
                previousVersion: null,
                changeType: 'new',
                pieceType: 'OFFICIAL',
                minimumSupportedRelease: '0.0.0',
                maximumSupportedRelease: '999.999.999',
            })
            expect(sent[0].event).not.toHaveProperty('projectId')
            expect(sent[0].event).not.toHaveProperty('userId')
        }
        expect(deliveriesTo(destinationUnentitled)).toEqual([])
    })

    it.each([
        { version: '2.0.0', action: ApplicationEventName.OFFICIAL_PIECE_MINOR_OR_MAJOR_VERSION_ADDED, changeType: 'major' },
        { version: '1.1.0', action: ApplicationEventName.OFFICIAL_PIECE_MINOR_OR_MAJOR_VERSION_ADDED, changeType: 'minor' },
        { version: '1.0.1', action: ApplicationEventName.OFFICIAL_PIECE_PATCH_VERSION_ADDED, changeType: 'patch' },
    ])('a sync that adds $version after 1.0.0 sends $action', async ({ version, action, changeType }) => {
        await seed([{ name: '@test/gmail', version: '1.0.0' }])
        const destinationId = await subscribe({ platformId: entitledA.platform.id })

        await sync([{ name: '@test/gmail', version }])

        const sent = deliveriesTo(destinationId)
        expect(sent).toHaveLength(1)
        expect(sent[0].event.action).toBe(action)
        expect(sent[0].event.data.piece).toMatchObject({ version, previousVersion: '1.0.0', changeType })
    })

    it('a destination gets only the piece events it subscribed to', async () => {
        await seed([{ name: '@test/gmail', version: '1.0.0' }])
        const patchOnly = await subscribe({ platformId: entitledA.platform.id, events: [ApplicationEventName.OFFICIAL_PIECE_PATCH_VERSION_ADDED] })
        const withoutPatch = await subscribe({ platformId: entitledA.platform.id, events: [ApplicationEventName.OFFICIAL_PIECE_ADDED, ApplicationEventName.OFFICIAL_PIECE_MINOR_OR_MAJOR_VERSION_ADDED] })

        await sync([{ name: '@test/gmail', version: '1.0.1' }])

        expect(deliveriesTo(patchOnly).map((delivery) => delivery.event.action)).toEqual([ApplicationEventName.OFFICIAL_PIECE_PATCH_VERSION_ADDED])
        expect(deliveriesTo(withoutPatch)).toEqual([])
    })

    it('a sync that adds several versions of a new piece sends one added event and a version event for each other version', async () => {
        const destinationId = await subscribe({ platformId: entitledA.platform.id })

        await sync([
            { name: '@test/multi', version: '0.1.0' },
            { name: '@test/multi', version: '0.3.0' },
            { name: '@test/multi', version: '0.2.0' },
        ])

        const sent = deliveriesTo(destinationId)
        expect(sent.map((delivery) => delivery.event.data.piece.version).sort()).toEqual(['0.1.0', '0.2.0', '0.3.0'])
        expect(sent.filter((delivery) => delivery.event.action === ApplicationEventName.OFFICIAL_PIECE_ADDED)).toHaveLength(1)
        expect(sent.filter((delivery) => delivery.event.data.piece.previousVersion === null)).toHaveLength(1)
    })

    it('a sync that adds a version older than the newest one sends a version event against the newest', async () => {
        await seed([{ name: '@test/gmail', version: '0.9.0' }])
        const destinationId = await subscribe({ platformId: entitledA.platform.id })

        await sync([{ name: '@test/gmail', version: '0.8.4' }])

        const sent = deliveriesTo(destinationId)
        expect(sent).toHaveLength(1)
        expect(sent[0].event.action).toBe(ApplicationEventName.OFFICIAL_PIECE_MINOR_OR_MAJOR_VERSION_ADDED)
        expect(sent[0].event.data.piece).toMatchObject({ version: '0.8.4', previousVersion: '0.9.0', changeType: 'minor' })
    })

    it('a sync that adds nothing sends nothing', async () => {
        await seed([{ name: '@test/gmail', version: '1.0.0' }])
        const destinationId = await subscribe({ platformId: entitledA.platform.id })

        await sync([])

        expect(deliveriesTo(destinationId)).toEqual([])
    })

    it('a sync that read the pieces before another replica inserted one sends nothing for it and keeps one row', async () => {
        const destinationId = await subscribe({ platformId: entitledA.platform.id })
        await sync([{ name: '@test/raced', version: '1.0.0' }])
        expect(deliveriesTo(destinationId)).toHaveLength(1)
        addSpy.mockClear()
        vi.spyOn(Repository.prototype, 'find').mockResolvedValueOnce([])

        await sync([])

        expect(deliveriesTo(destinationId)).toEqual([])
        expect(await databaseConnection().getRepository('piece_metadata').countBy({ name: '@test/raced' })).toBe(1)
    })

    it('a custom piece with the same name does not count as an existing version', async () => {
        await pieceMetadataService(app.log).create({
            platformId: entitledA.platform.id,
            pieceMetadata: {
                name: '@test/shadowed',
                displayName: 'shadowed',
                logoUrl: 'https://cdn.activepieces.com/pieces/test.png',
                description: 'custom',
                authors: [],
                version: '5.0.0',
                minimumSupportedRelease: '0.0.0',
                maximumSupportedRelease: '999.999.999',
                actions: {},
                triggers: {},
                contextInfo: undefined,
            },
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.CUSTOM,
            publishCacheRefresh: false,
        })
        const destinationId = await subscribe({ platformId: entitledA.platform.id })

        await sync([{ name: '@test/shadowed', version: '1.0.0' }])

        const sent = deliveriesTo(destinationId)
        expect(sent).toHaveLength(1)
        expect(sent[0].event.action).toBe(ApplicationEventName.OFFICIAL_PIECE_ADDED)
    })

    it('every installed version writes one log line with the piece name and version', async () => {
        const infoSpy = vi.spyOn(app.log, 'info')

        await sync([
            { name: '@test/logged', version: '1.0.0' },
            { name: '@test/logged', version: '1.1.0' },
        ])

        const installLines = infoSpy.mock.calls.filter(([, message]) => message === '[pieceMetadataService#create] Piece version installed')
        expect(installLines.map(([fields]) => fields)).toEqual(expect.arrayContaining([
            expect.objectContaining({ piece: expect.objectContaining({ name: '@test/logged', version: '1.0.0', type: PieceType.OFFICIAL }) }),
            expect.objectContaining({ piece: expect.objectContaining({ name: '@test/logged', version: '1.1.0', type: PieceType.OFFICIAL }) }),
        ]))
        expect(installLines).toHaveLength(2)
    })

    it('an admin publish of a new piece sends official_piece.added', async () => {
        const destinationId = await subscribe({ platformId: entitledA.platform.id })

        expect(await adminPublish({ name: '@test/published', version: '1.0.0' })).toBe(200)

        const sent = deliveriesTo(destinationId)
        expect(sent).toHaveLength(1)
        expect(sent[0].event.action).toBe(ApplicationEventName.OFFICIAL_PIECE_ADDED)
    })

    it('an admin publish of a newer version compares it with the versions already published', async () => {
        const destinationId = await subscribe({ platformId: entitledA.platform.id })
        expect(await adminPublish({ name: '@test/published', version: '1.0.0' })).toBe(200)
        addSpy.mockClear()

        expect(await adminPublish({ name: '@test/published', version: '1.1.0' })).toBe(200)

        const sent = deliveriesTo(destinationId)
        expect(sent).toHaveLength(1)
        expect(sent[0].event.action).toBe(ApplicationEventName.OFFICIAL_PIECE_MINOR_OR_MAJOR_VERSION_ADDED)
        expect(sent[0].event.data.piece).toMatchObject({ version: '1.1.0', previousVersion: '1.0.0', changeType: 'minor' })
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
