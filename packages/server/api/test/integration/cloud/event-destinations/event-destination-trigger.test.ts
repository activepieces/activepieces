import {
    apId,
    ApplicationEventName,
    EventDestinationScope,
    WorkerJobType,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import { createTestContext } from '../../../helpers/test-context'
import { createMockEventDestination } from '../../../helpers/mocks'
import { db } from '../../../helpers/db'
import { eventDestinationService } from '../../../../src/app/event-destinations/event-destinations.service'
import * as jobQueueModule from '../../../../src/app/workers/job-queue/job-queue'

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

        await eventDestinationService(app.log).trigger({
            platformId: ctx.platform.id,
            event: {
                action: ApplicationEventName.FLOW_CREATED,
                data: { flow: { id: apId(), created: new Date().toISOString(), updated: new Date().toISOString() }, project: { displayName: 'Test' } },
            },
        })

        expect(addSpy).toHaveBeenCalledTimes(1)
        expect(addSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    webhookUrl: destination.url,
                    jobType: WorkerJobType.EVENT_DESTINATION,
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
            platformId: ctx.platform.id,
            event: {
                action: ApplicationEventName.FLOW_DELETED,
                data: { flow: { id: apId(), created: new Date().toISOString(), updated: new Date().toISOString() }, project: { displayName: 'Test' } },
            },
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
            platformId: ctx2.platform.id,
            event: {
                action: ApplicationEventName.FLOW_CREATED,
                data: { flow: { id: apId(), created: new Date().toISOString(), updated: new Date().toISOString() }, project: { displayName: 'Test' } },
            },
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

        await eventDestinationService(app.log).trigger({
            platformId: ctx.platform.id,
            event: {
                action: ApplicationEventName.FLOW_CREATED,
                data: { flow: { id: apId(), created: new Date().toISOString(), updated: new Date().toISOString() }, project: { displayName: 'Test' } },
            },
        })

        expect(addSpy).toHaveBeenCalledTimes(2)
        const urls = addSpy.mock.calls.map((call: unknown[]) => (call[0] as Record<string, Record<string, string>>).data.webhookUrl)
        expect(urls).toContain('https://example.com/hook1')
        expect(urls).toContain('https://example.com/hook2')
    })

    it('should match destination when events array has multiple entries', async () => {
        const ctx = await createTestContext(app)
        const destination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_CREATED, ApplicationEventName.FLOW_DELETED],
            scope: EventDestinationScope.PLATFORM,
        })
        await db.save('event_destination', destination)

        await eventDestinationService(app.log).trigger({
            platformId: ctx.platform.id,
            event: {
                action: ApplicationEventName.FLOW_DELETED,
                data: { flow: { id: apId(), created: new Date().toISOString(), updated: new Date().toISOString() }, project: { displayName: 'Test' } },
            },
        })

        expect(addSpy).toHaveBeenCalledTimes(1)
        expect(addSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    webhookUrl: destination.url,
                    jobType: WorkerJobType.EVENT_DESTINATION,
                }),
            }),
        )
    })
})
