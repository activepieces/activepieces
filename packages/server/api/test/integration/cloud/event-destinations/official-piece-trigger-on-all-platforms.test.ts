import { ApplicationEventName, EventDestinationScope, PieceChangeType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { eventDestinationEntitlementHooks } from '../../../../src/app/ee/platform-webhooks/event-destination-entitlement-hooks'
import { EventDestinationHooks, eventDestinationHooks } from '../../../../src/app/event-destinations/event-destinations-hooks'
import { AddedPiece, eventDestinationService } from '../../../../src/app/event-destinations/event-destinations.service'
import * as jobQueueModule from '../../../../src/app/workers/job-queue/job-queue'
import { db } from '../../../helpers/db'
import { createMockEventDestination } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const ENTITLED_PLAN = { plan: { eventStreamingEnabled: true } }

const PIECE_EVENTS = [ApplicationEventName.OFFICIAL_PIECE_ADDED, ApplicationEventName.OFFICIAL_PIECE_MINOR_OR_MAJOR_VERSION_ADDED, ApplicationEventName.OFFICIAL_PIECE_PATCH_VERSION_ADDED]

const added = (name: string, version: string): AddedPiece => ({
    name,
    displayName: name,
    version,
    minimumSupportedRelease: '0.30.0',
    maximumSupportedRelease: '999.999.999',
    deprecated: false,
})

const existing = (name: string, version: string) => ({ name, version })

const subscribe = async ({ platformId, events = PIECE_EVENTS, enabled = true }: SubscribeParams): Promise<string> => {
    const destination = createMockEventDestination({
        platformId,
        events,
        enabled,
        scope: EventDestinationScope.PLATFORM,
        url: 'https://collector.example.com/v1/events',
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

describe('triggerOnAllPlatforms for official piece events', () => {
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
    })

    it('reaches two subscribed platforms once each', async () => {
        const first = await createTestContext(app, ENTITLED_PLAN)
        const second = await createTestContext(app, ENTITLED_PLAN)
        const firstDestinationId = await subscribe({ platformId: first.platform.id })
        const secondDestinationId = await subscribe({ platformId: second.platform.id })

        await eventDestinationService(app.log).triggerOnAllPlatforms({
            existingPieces: [existing('@activepieces/piece-gmail', '1.0.0')],
            addedPieces: [added('@activepieces/piece-gmail', '1.1.0')],
        })

        const jobs = queuedJobs()
        expect(jobs).toHaveLength(2)
        expect(jobs.map((job) => job.data.webhookId).sort()).toEqual([firstDestinationId, secondDestinationId].sort())
        expect(jobs.map((job) => job.data.payload.platformId).sort()).toEqual([first.platform.id, second.platform.id].sort())
        for (const job of jobs) {
            expect(job.data.projectId).toBeUndefined()
            expect(job.data.payload).not.toHaveProperty('projectId')
            expect(job.data.payload).not.toHaveProperty('userId')
            expect(job.data.payload).not.toHaveProperty('ip')
            expect(job.data.payload.action).toBe(ApplicationEventName.OFFICIAL_PIECE_MINOR_OR_MAJOR_VERSION_ADDED)
            expect(job.data.payload.data.piece).toEqual({
                name: '@activepieces/piece-gmail',
                displayName: '@activepieces/piece-gmail',
                version: '1.1.0',
                previousVersion: '1.0.0',
                changeType: 'minor',
                pieceType: 'OFFICIAL',
                minimumSupportedRelease: '0.30.0',
                maximumSupportedRelease: '999.999.999',
                deprecated: false,
            })
        }
    })

    it('unsubscribed, disabled and unentitled destinations get nothing', async () => {
        const unsubscribed = await createTestContext(app, ENTITLED_PLAN)
        const disabled = await createTestContext(app, ENTITLED_PLAN)
        const unentitled = await createTestContext(app, { plan: { eventStreamingEnabled: false } })
        await subscribe({ platformId: unsubscribed.platform.id, events: [ApplicationEventName.FLOW_CREATED] })
        await subscribe({ platformId: disabled.platform.id, enabled: false })
        await subscribe({ platformId: unentitled.platform.id })

        await eventDestinationService(app.log).triggerOnAllPlatforms({ existingPieces: [], addedPieces: [added('@test/a', '1.0.0')] })

        expect(addSpy).not.toHaveBeenCalled()
    })

    it('a destination subscribed to every other event gets nothing', async () => {
        const ctx = await createTestContext(app, ENTITLED_PLAN)
        const otherEvents = Object.values(ApplicationEventName).filter((event) => !PIECE_EVENTS.includes(event))
        await subscribe({ platformId: ctx.platform.id, events: otherEvents })

        await eventDestinationService(app.log).triggerOnAllPlatforms({ existingPieces: [], addedPieces: [added('@test/a', '1.0.0')] })

        expect(addSpy).not.toHaveBeenCalled()
    })

    it.each<ChangeCase>([
        { previous: null, version: '1.0.0', changeType: 'new', action: ApplicationEventName.OFFICIAL_PIECE_ADDED },
        { previous: '1.0.0', version: '2.0.0', changeType: 'major', action: ApplicationEventName.OFFICIAL_PIECE_MINOR_OR_MAJOR_VERSION_ADDED },
        { previous: '1.0.0', version: '1.1.0', changeType: 'minor', action: ApplicationEventName.OFFICIAL_PIECE_MINOR_OR_MAJOR_VERSION_ADDED },
        { previous: '1.0.0', version: '1.0.1', changeType: 'patch', action: ApplicationEventName.OFFICIAL_PIECE_PATCH_VERSION_ADDED },
        { previous: '1.0.0', version: '2.0.0-beta.1', changeType: 'major', action: ApplicationEventName.OFFICIAL_PIECE_MINOR_OR_MAJOR_VERSION_ADDED },
        { previous: '1.0.0', version: '1.1.0-beta.1', changeType: 'minor', action: ApplicationEventName.OFFICIAL_PIECE_MINOR_OR_MAJOR_VERSION_ADDED },
    ])('$previous → $version is $changeType, sent as $action only to destinations subscribed to it', async ({ previous, version, changeType, action }) => {
        const ctx = await createTestContext(app, ENTITLED_PLAN)
        const subscribedId = await subscribe({ platformId: ctx.platform.id, events: [action] })
        await subscribe({ platformId: ctx.platform.id, events: PIECE_EVENTS.filter((event) => event !== action) })

        await eventDestinationService(app.log).triggerOnAllPlatforms({
            existingPieces: previous === null ? [] : [existing('@test/a', previous)],
            addedPieces: [added('@test/a', version)],
        })

        expect(addSpy).toHaveBeenCalledTimes(1)
        const [job] = queuedJobs()
        expect(job.data.webhookId).toBe(subscribedId)
        expect(job.data.payload.action).toBe(action)
        expect(job.data.payload.data.piece).toMatchObject({ version, previousVersion: previous, changeType })
    })

    it('compares with the newest existing version, whatever the row order', async () => {
        const ctx = await createTestContext(app, ENTITLED_PLAN)
        await subscribe({ platformId: ctx.platform.id })

        await eventDestinationService(app.log).triggerOnAllPlatforms({
            existingPieces: [existing('@test/a', '1.2.0'), existing('@test/a', '1.10.0'), existing('@test/a', '1.9.0')],
            addedPieces: [added('@test/a', '1.10.1')],
        })

        expect(queuedJobs().map((job) => job.data.payload.data.piece)).toEqual([expect.objectContaining({ version: '1.10.1', previousVersion: '1.10.0', changeType: 'patch' })])
    })

    it('several added versions of one piece send one event for the newest', async () => {
        const ctx = await createTestContext(app, ENTITLED_PLAN)
        await subscribe({ platformId: ctx.platform.id })

        await eventDestinationService(app.log).triggerOnAllPlatforms({
            existingPieces: [],
            addedPieces: [added('@test/a', '0.1.0'), added('@test/a', '0.3.0'), added('@test/a', '0.2.0')],
        })

        expect(queuedJobs().map((job) => [job.data.payload.action, job.data.payload.data.piece.version])).toEqual([[ApplicationEventName.OFFICIAL_PIECE_ADDED, '0.3.0']])
    })

    it.each([
        { label: 'an older version', version: '0.8.4' },
        { label: 'the same version', version: '0.9.0' },
    ])('$label than the newest existing one sends nothing', async ({ version }) => {
        const ctx = await createTestContext(app, ENTITLED_PLAN)
        await subscribe({ platformId: ctx.platform.id })

        await eventDestinationService(app.log).triggerOnAllPlatforms({
            existingPieces: [existing('@test/a', '0.9.0')],
            addedPieces: [added('@test/a', version)],
        })

        expect(addSpy).not.toHaveBeenCalled()
    })

    it('existing versions of other pieces do not count, and events go out in piece name order', async () => {
        const ctx = await createTestContext(app, ENTITLED_PLAN)
        await subscribe({ platformId: ctx.platform.id })

        await eventDestinationService(app.log).triggerOnAllPlatforms({
            existingPieces: [existing('@test/slack', '5.0.0')],
            addedPieces: [added('@test/slack', '5.1.0'), added('@test/asana', '1.0.0'), added('@test/gmail', '1.0.0')],
        })

        expect(queuedJobs().map((job) => [job.data.payload.data.piece.name, job.data.payload.data.piece.changeType])).toEqual([
            ['@test/asana', 'new'],
            ['@test/gmail', 'new'],
            ['@test/slack', 'minor'],
        ])
    })

    it('dispatches a platform\'s deliveries at most 25 at a time', async () => {
        const ctx = await createTestContext(app, ENTITLED_PLAN)
        await subscribe({ platformId: ctx.platform.id })
        let inFlight = 0
        let maxInFlight = 0
        addSpy.mockImplementation(async () => {
            inFlight++
            maxInFlight = Math.max(maxInFlight, inFlight)
            await new Promise((resolve) => setTimeout(resolve, 5))
            inFlight--
        })
        const addedPieces = Array.from({ length: 60 }, (_, index) => added(`@test/bulk-${String(index).padStart(2, '0')}`, '1.0.0'))

        await eventDestinationService(app.log).triggerOnAllPlatforms({ existingPieces: [], addedPieces })

        expect(addSpy).toHaveBeenCalledTimes(60)
        expect(maxInFlight).toBe(25)
    })

    it('reads entitlement once for every subscribed platform', async () => {
        const platformIds: string[] = []
        for (let index = 0; index < 3; index++) {
            const context = await createTestContext(app, ENTITLED_PLAN)
            await subscribe({ platformId: context.platform.id })
            platformIds.push(context.platform.id)
        }
        const real = eventDestinationEntitlementHooks(app.log)
        const entitlementReads: string[][] = []
        eventDestinationHooks.set((): EventDestinationHooks => ({
            doesPlatformHaveEventStreamingEnabled: async () => {
                throw new Error('per-platform entitlement read')
            },
            fetchPlatformIdsWithEventStreamingEnabled: async (params) => {
                entitlementReads.push([...params.platformIds].sort())
                return real.fetchPlatformIdsWithEventStreamingEnabled(params)
            },
        }))

        await eventDestinationService(app.log).triggerOnAllPlatforms({ existingPieces: [], addedPieces: [added('@test/a', '1.0.0')] })

        expect(addSpy).toHaveBeenCalledTimes(3)
        expect(entitlementReads).toEqual([[...platformIds].sort()])
    })

    it('reads destinations in pages of 100 and delivers to every page', async () => {
        const ctx = await createTestContext(app, ENTITLED_PLAN)
        const destinations = Array.from({ length: 101 }, () => createMockEventDestination({
            platformId: ctx.platform.id,
            events: PIECE_EVENTS,
            enabled: true,
            scope: EventDestinationScope.PLATFORM,
            url: 'https://collector.example.com/v1/events',
        }))
        await db.save('event_destination', destinations)
        const real = eventDestinationEntitlementHooks(app.log)
        const entitlementReads: number[] = []
        eventDestinationHooks.set((): EventDestinationHooks => ({
            ...real,
            fetchPlatformIdsWithEventStreamingEnabled: async (params) => {
                entitlementReads.push(params.platformIds.length)
                return real.fetchPlatformIdsWithEventStreamingEnabled(params)
            },
        }))

        await eventDestinationService(app.log).triggerOnAllPlatforms({ existingPieces: [], addedPieces: [added('@test/a', '1.0.0')] })

        expect(entitlementReads).toEqual([1, 1])
        expect(new Set(queuedJobs().map((job) => job.data.webhookId))).toEqual(new Set(destinations.map((destination) => destination.id)))
        expect(addSpy).toHaveBeenCalledTimes(101)
    })
})

type ChangeCase = {
    previous: string | null
    version: string
    changeType: PieceChangeType
    action: ApplicationEventName
}

type SubscribeParams = {
    platformId: string
    events?: ApplicationEventName[]
    enabled?: boolean
}

type QueuedJob = {
    id: string
    data: {
        webhookId: string
        projectId?: string
        payload: {
            platformId: string
            action: ApplicationEventName
            data: { piece: Record<string, unknown> & { name: string, version: string, changeType: string }}
        }
    }
}
