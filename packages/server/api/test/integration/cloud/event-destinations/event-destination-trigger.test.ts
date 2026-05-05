import {
    apId,
    ApplicationEventName,
    EventDestinationScope,
    WorkerJobType,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { domainHelper } from '../../../../src/app/ee/custom-domains/domain-helper'
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

    it('should NOT dispatch FLOW_RUN_FINISHED to a destination whose URL is the same flow webhook (recursion guard)', async () => {
        const ctx = await createTestContext(app)
        const flowId = apId()
        const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
            path: 'v1/webhooks',
            platformId: ctx.platform.id,
        })
        const destination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
            scope: EventDestinationScope.PLATFORM,
            url: `${webhookUrlPrefix}/${flowId}`,
        })
        await db.save('event_destination', destination)

        await eventDestinationService(app.log).trigger({
            platformId: ctx.platform.id,
            event: {
                action: ApplicationEventName.FLOW_RUN_FINISHED,
                data: {
                    flowRun: {
                        id: apId(),
                        environment: 'PRODUCTION',
                        flowId,
                        flowVersionId: apId(),
                        status: 'SUCCEEDED',
                    },
                    project: { displayName: 'Test' },
                },
            },
        })

        expect(addSpy).not.toHaveBeenCalled()
    })

    it('should still dispatch FLOW_RUN_FINISHED to a same-host destination that targets a different flow', async () => {
        const ctx = await createTestContext(app)
        const finishedFlowId = apId()
        const otherFlowId = apId()
        const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
            path: 'v1/webhooks',
            platformId: ctx.platform.id,
        })
        const destination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
            scope: EventDestinationScope.PLATFORM,
            url: `${webhookUrlPrefix}/${otherFlowId}`,
        })
        await db.save('event_destination', destination)

        await eventDestinationService(app.log).trigger({
            platformId: ctx.platform.id,
            event: {
                action: ApplicationEventName.FLOW_RUN_FINISHED,
                data: {
                    flowRun: {
                        id: apId(),
                        environment: 'PRODUCTION',
                        flowId: finishedFlowId,
                        flowVersionId: apId(),
                        status: 'SUCCEEDED',
                    },
                    project: { displayName: 'Test' },
                },
            },
        })

        expect(addSpy).toHaveBeenCalledTimes(1)
        expect(addSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ webhookUrl: destination.url }),
            }),
        )
    })

    it('should skip self-targeting destination but keep dispatching to other destinations on the same FLOW_RUN_FINISHED event', async () => {
        const ctx = await createTestContext(app)
        const flowId = apId()
        const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
            path: 'v1/webhooks',
            platformId: ctx.platform.id,
        })
        const selfTargetingDestination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
            scope: EventDestinationScope.PLATFORM,
            url: `${webhookUrlPrefix}/${flowId}`,
        })
        const externalDestination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
            scope: EventDestinationScope.PLATFORM,
            url: 'https://hooks.slack.example.com/services/abc',
        })
        await db.save('event_destination', [selfTargetingDestination, externalDestination])

        await eventDestinationService(app.log).trigger({
            platformId: ctx.platform.id,
            event: {
                action: ApplicationEventName.FLOW_RUN_FINISHED,
                data: {
                    flowRun: {
                        id: apId(),
                        environment: 'PRODUCTION',
                        flowId,
                        flowVersionId: apId(),
                        status: 'FAILED',
                    },
                    project: { displayName: 'Test' },
                },
            },
        })

        expect(addSpy).toHaveBeenCalledTimes(1)
        expect(addSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ webhookUrl: externalDestination.url }),
            }),
        )
    })

    it('should NOT skip a same-host destination for non flow-run events (e.g. FLOW_CREATED)', async () => {
        const ctx = await createTestContext(app)
        const flowId = apId()
        const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
            path: 'v1/webhooks',
            platformId: ctx.platform.id,
        })
        const destination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_CREATED],
            scope: EventDestinationScope.PLATFORM,
            url: `${webhookUrlPrefix}/${flowId}`,
        })
        await db.save('event_destination', destination)

        await eventDestinationService(app.log).trigger({
            platformId: ctx.platform.id,
            event: {
                action: ApplicationEventName.FLOW_CREATED,
                data: {
                    flow: { id: flowId, created: new Date().toISOString(), updated: new Date().toISOString() },
                    project: { displayName: 'Test' },
                },
            },
        })

        expect(addSpy).toHaveBeenCalledTimes(1)
    })
})
