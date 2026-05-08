import {
    apId,
    ApplicationEvent,
    ApplicationEventName,
    EventDestinationScope,
    WorkerJobType,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { eventDestinationService } from '../../../../src/app/event-destinations/event-destinations.service'
import * as jobQueueModule from '../../../../src/app/workers/job-queue/job-queue'
import { db } from '../../../helpers/db'
import { createMockEventDestination } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const originalJobQueue = jobQueueModule.jobQueue

describe('Event Destination Trigger', () => {
    let addSpy: ReturnType<typeof vi.fn>

    beforeEach(() => {
        addSpy = vi.fn()
        vi.spyOn(jobQueueModule, 'jobQueue').mockImplementation((log) => {
            const real = originalJobQueue(log)
            return {
                ...real,
                add: addSpy,
            }
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('should queue job for matching PLATFORM scope destination', async () => {
        const ctx = await createTestContext(app)
        const destination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_CREATED],
            scope: EventDestinationScope.PLATFORM,
        })
        await db.save('event_destination', destination)

        const event = buildFlowEvent(ApplicationEventName.FLOW_CREATED, ctx.platform.id)
        await eventDestinationService(app.log).trigger({ event })

        expect(addSpy).toHaveBeenCalledTimes(1)
        expect(addSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    platformId: ctx.platform.id,
                    webhookUrl: destination.url,
                    jobType: WorkerJobType.EVENT_DESTINATION,
                    payload: event,
                }),
            }),
        )
    })

    it('should NOT queue job when event action does not match', async () => {
        const ctx = await createTestContext(app)
        const destination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_CREATED],
            scope: EventDestinationScope.PLATFORM,
        })
        await db.save('event_destination', destination)

        await eventDestinationService(app.log).trigger({
            event: buildFlowEvent(ApplicationEventName.FLOW_DELETED, ctx.platform.id),
        })

        expect(addSpy).not.toHaveBeenCalled()
    })

    it('should NOT trigger destinations from a different platform', async () => {
        const ctx1 = await createTestContext(app)
        const ctx2 = await createTestContext(app)
        const destination = createMockEventDestination({
            platformId: ctx1.platform.id,
            events: [ApplicationEventName.FLOW_CREATED],
            scope: EventDestinationScope.PLATFORM,
        })
        await db.save('event_destination', destination)

        await eventDestinationService(app.log).trigger({
            event: buildFlowEvent(ApplicationEventName.FLOW_CREATED, ctx2.platform.id),
        })

        expect(addSpy).not.toHaveBeenCalled()
    })

    it('should trigger all matching destinations', async () => {
        const ctx = await createTestContext(app)
        const dest1 = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_CREATED],
            scope: EventDestinationScope.PLATFORM,
            url: 'https://example.com/hook1',
        })
        const dest2 = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_CREATED],
            scope: EventDestinationScope.PLATFORM,
            url: 'https://example.com/hook2',
        })
        await db.save('event_destination', [dest1, dest2])

        const event = buildFlowEvent(ApplicationEventName.FLOW_CREATED, ctx.platform.id)
        await eventDestinationService(app.log).trigger({ event })

        expect(addSpy).toHaveBeenCalledTimes(2)
        const queuedJobs = addSpy.mock.calls.map((call: unknown[]) => (call[0] as { data: { webhookUrl: string, payload: unknown } }).data)
        expect(queuedJobs.map(j => j.webhookUrl)).toEqual(expect.arrayContaining(['https://example.com/hook1', 'https://example.com/hook2']))
        for (const job of queuedJobs) {
            expect(job.payload).toEqual(event)
        }
    })

    it('should match destination when events array has multiple entries', async () => {
        const ctx = await createTestContext(app)
        const destination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_CREATED, ApplicationEventName.FLOW_DELETED],
            scope: EventDestinationScope.PLATFORM,
        })
        await db.save('event_destination', destination)

        const event = buildFlowEvent(ApplicationEventName.FLOW_DELETED, ctx.platform.id)
        await eventDestinationService(app.log).trigger({ event })

        expect(addSpy).toHaveBeenCalledTimes(1)
        expect(addSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    platformId: ctx.platform.id,
                    webhookUrl: destination.url,
                    jobType: WorkerJobType.EVENT_DESTINATION,
                    payload: event,
                }),
            }),
        )
    })
})

const buildFlowEvent = (action: ApplicationEventName.FLOW_CREATED | ApplicationEventName.FLOW_DELETED, platformId: string): ApplicationEvent => ({
    id: apId(),
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    platformId,
    action,
    data: {
        flow: { id: apId(), created: new Date().toISOString(), updated: new Date().toISOString() },
        project: { displayName: 'Test' },
    },
})
