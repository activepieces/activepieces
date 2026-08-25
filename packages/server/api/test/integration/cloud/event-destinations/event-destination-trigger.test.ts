import { apId } from '@activepieces/core-utils'
import { ApplicationEventName, EventDestinationScope, FlowCreatedEvent, FlowDeletedEvent, FlowRunEvent, WorkerJobType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { eventDestinationService } from '../../../../src/app/event-destinations/event-destinations.service'
import { applicationEvents } from '../../../../src/app/helper/application-events'
import { domainHelper } from '../../../../src/app/helper/domain-helper'
import { WebhookFlowVersionToRun, webhookService } from '../../../../src/app/webhooks/webhook.service'
import * as jobQueueModule from '../../../../src/app/workers/job-queue/job-queue'
import { db } from '../../../helpers/db'
import { createMockEventDestination } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

type FlowEventAction = FlowCreatedEvent['action'] | FlowDeletedEvent['action']

const buildEnvelope = ({ platformId, projectId }: { platformId: string, projectId?: string }) => {
    const isoNow = new Date().toISOString()
    return {
        id: apId(),
        created: isoNow,
        updated: isoNow,
        ip: '127.0.0.1',
        platformId,
        projectId,
        userId: apId(),
    }
}

const buildFlowEvent = (action: FlowEventAction, params: { platformId: string, projectId?: string, flowId?: string }): FlowCreatedEvent | FlowDeletedEvent => {
    const isoNow = new Date().toISOString()
    const flow = { id: params.flowId ?? apId(), created: isoNow, updated: isoNow }
    const project = { displayName: 'Test' }
    if (action === ApplicationEventName.FLOW_CREATED) {
        return { ...buildEnvelope(params), action, data: { flow, project } }
    }
    return {
        ...buildEnvelope(params),
        action,
        data: {
            flow,
            project,
            flowVersion: { id: apId(), displayName: 'Sample', flowId: flow.id, created: isoNow, updated: isoNow },
        },
    }
}

const buildFlowRunEvent = (params: { platformId: string, projectId?: string, flowId?: string, status?: 'SUCCEEDED' | 'FAILED' | 'RUNNING' }): FlowRunEvent => {
    return {
        ...buildEnvelope(params),
        action: ApplicationEventName.FLOW_RUN_FINISHED,
        data: {
            flowRun: {
                id: apId(),
                environment: 'PRODUCTION',
                flowId: params.flowId ?? apId(),
                flowVersionId: apId(),
                stepNameToTest: null,
                status: params.status ?? 'SUCCEEDED',
            },
            project: { displayName: 'Test' },
        },
    }
}

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
    let handleWebhookSpy: ReturnType<typeof vi.spyOn<typeof webhookService, 'handleWebhook'>>

    beforeEach(() => {
        addSpy = vi.fn()
        vi.spyOn(jobQueueModule, 'jobQueue').mockImplementation((log) => {
            const real = originalJobQueue(log)
            return {
                ...real,
                add: addSpy,
            }
        })
        handleWebhookSpy = vi.spyOn(webhookService, 'handleWebhook').mockResolvedValue({
            status: 200,
            body: {},
            headers: {},
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

        const event = buildFlowEvent(ApplicationEventName.FLOW_CREATED, { platformId: ctx.platform.id })
        await eventDestinationService(app.log).trigger({
            event,
        })

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
            event: buildFlowEvent(ApplicationEventName.FLOW_DELETED, { platformId: ctx.platform.id }),
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
            event: buildFlowEvent(ApplicationEventName.FLOW_CREATED, { platformId: ctx2.platform.id }),
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

        const event = buildFlowEvent(ApplicationEventName.FLOW_CREATED, { platformId: ctx.platform.id })
        await eventDestinationService(app.log).trigger({
            event,
        })

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

        const event = buildFlowEvent(ApplicationEventName.FLOW_DELETED, { platformId: ctx.platform.id })
        await eventDestinationService(app.log).trigger({
            event,
        })

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

    it('should NOT dispatch FLOW_RUN_FINISHED to a destination whose URL is the same flow webhook (recursion guard)', async () => {
        const ctx = await createTestContext(app)
        const flowId = apId()
        const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
            path: 'v1/webhooks',
        })
        const destination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
            scope: EventDestinationScope.PLATFORM,
            url: `${webhookUrlPrefix}/${flowId}`,
        })
        await db.save('event_destination', destination)

        await eventDestinationService(app.log).trigger({
            event: buildFlowRunEvent({ platformId: ctx.platform.id, flowId }),
        })

        expect(addSpy).not.toHaveBeenCalled()
    })

    it('should NOT dispatch FLOW_RUN_FINISHED to a destination targeting the same flow webhook on a different origin (recursion guard, embed domain)', async () => {
        const ctx = await createTestContext(app)
        const flowId = apId()
        const destination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
            scope: EventDestinationScope.PLATFORM,
            url: `https://tenant.embed.example.com/api/v1/webhooks/${flowId}`,
        })
        await db.save('event_destination', destination)

        await eventDestinationService(app.log).trigger({
            event: buildFlowRunEvent({ platformId: ctx.platform.id, flowId }),
        })

        expect(addSpy).not.toHaveBeenCalled()
        expect(handleWebhookSpy).not.toHaveBeenCalled()
    })

    it('should NOT dispatch FLOW_RUN_FINISHED when the self-targeting destination percent-encodes the flow id in its URL', async () => {
        const ctx = await createTestContext(app)
        const flowId = apId()
        const encodedFlowId = `%${flowId.charCodeAt(0).toString(16).padStart(2, '0')}${flowId.slice(1)}`
        const destination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
            scope: EventDestinationScope.PLATFORM,
            url: `https://tenant.embed.example.com/api/v1/webhooks/${encodedFlowId}`,
        })
        await db.save('event_destination', destination)

        await eventDestinationService(app.log).trigger({
            event: buildFlowRunEvent({ platformId: ctx.platform.id, flowId }),
        })

        expect(addSpy).not.toHaveBeenCalled()
        expect(handleWebhookSpy).not.toHaveBeenCalled()
    })

    it('should still dispatch FLOW_RUN_FINISHED to a different-origin destination that targets a different flow (as an outbound job)', async () => {
        const ctx = await createTestContext(app)
        const finishedFlowId = apId()
        const otherFlowId = apId()
        const destination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
            scope: EventDestinationScope.PLATFORM,
            url: `https://tenant.embed.example.com/api/v1/webhooks/${otherFlowId}`,
        })
        await db.save('event_destination', destination)

        await eventDestinationService(app.log).trigger({
            event: buildFlowRunEvent({ platformId: ctx.platform.id, flowId: finishedFlowId }),
        })

        expect(addSpy).toHaveBeenCalledTimes(1)
        expect(addSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ webhookUrl: destination.url }),
            }),
        )
        expect(handleWebhookSpy).not.toHaveBeenCalled()
    })

    it('should skip a different-origin self-targeting destination but keep dispatching to external destinations on the same FLOW_RUN_FINISHED event', async () => {
        const ctx = await createTestContext(app)
        const flowId = apId()
        const selfTargetingDestination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
            scope: EventDestinationScope.PLATFORM,
            url: `https://tenant.embed.example.com/api/v1/webhooks/${flowId}`,
        })
        const webhookShapedDestination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
            scope: EventDestinationScope.PLATFORM,
            url: `https://other-instance.example.com/api/v1/webhooks/${apId()}`,
        })
        const externalDestination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
            scope: EventDestinationScope.PLATFORM,
            url: 'https://hooks.slack.example.com/services/abc',
        })
        await db.save('event_destination', [selfTargetingDestination, webhookShapedDestination, externalDestination])

        await eventDestinationService(app.log).trigger({
            event: buildFlowRunEvent({ platformId: ctx.platform.id, flowId, status: 'FAILED' }),
        })

        expect(addSpy).toHaveBeenCalledTimes(1)
        expect(addSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ webhookUrl: externalDestination.url }),
            }),
        )
        expect(handleWebhookSpy).not.toHaveBeenCalled()
    })

    it('should still dispatch FLOW_RUN_FINISHED to a same-host destination that targets a different flow (internally, without an outbound job)', async () => {
        const ctx = await createTestContext(app)
        const finishedFlowId = apId()
        const otherFlowId = apId()
        const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
            path: 'v1/webhooks',
        })
        const destination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
            scope: EventDestinationScope.PLATFORM,
            url: `${webhookUrlPrefix}/${otherFlowId}`,
        })
        await db.save('event_destination', destination)

        await eventDestinationService(app.log).trigger({
            event: buildFlowRunEvent({ platformId: ctx.platform.id, flowId: finishedFlowId }),
        })

        expect(addSpy).not.toHaveBeenCalled()
        expect(handleWebhookSpy).toHaveBeenCalledTimes(1)
        expect(handleWebhookSpy).toHaveBeenCalledWith(
            expect.objectContaining({ flowId: otherFlowId, async: true }),
        )
    })

    it('should skip self-targeting destination but keep dispatching to other destinations on the same FLOW_RUN_FINISHED event', async () => {
        const ctx = await createTestContext(app)
        const flowId = apId()
        const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
            path: 'v1/webhooks',
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
            event: buildFlowRunEvent({ platformId: ctx.platform.id, flowId, status: 'FAILED' }),
        })

        expect(addSpy).toHaveBeenCalledTimes(1)
        expect(addSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ webhookUrl: externalDestination.url }),
            }),
        )
    })

    it('should drop both internal destinations when two flows are mutually wired (A↔B cycle), and still fire externals', async () => {
        const ctx = await createTestContext(app)
        const flowAId = apId()
        const flowBId = apId()
        const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
            path: 'v1/webhooks',
        })
        const internalDestinationA = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
            scope: EventDestinationScope.PLATFORM,
            url: `${webhookUrlPrefix}/${flowAId}`,
        })
        const internalDestinationB = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
            scope: EventDestinationScope.PLATFORM,
            url: `${webhookUrlPrefix}/${flowBId}`,
        })
        const externalDestination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
            scope: EventDestinationScope.PLATFORM,
            url: 'https://hooks.slack.example.com/services/abc',
        })
        await db.save('event_destination', [internalDestinationA, internalDestinationB, externalDestination])

        await eventDestinationService(app.log).trigger({
            event: buildFlowRunEvent({ platformId: ctx.platform.id, flowId: flowAId }),
        })

        expect(addSpy).toHaveBeenCalledTimes(1)
        expect(addSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ webhookUrl: externalDestination.url }),
            }),
        )
    })

    it('should not fire any destination when an A↔B cycle has no external destinations', async () => {
        const ctx = await createTestContext(app)
        const flowAId = apId()
        const flowBId = apId()
        const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
            path: 'v1/webhooks',
        })
        const internalDestinationA = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
            scope: EventDestinationScope.PLATFORM,
            url: `${webhookUrlPrefix}/${flowAId}`,
        })
        const internalDestinationB = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
            scope: EventDestinationScope.PLATFORM,
            url: `${webhookUrlPrefix}/${flowBId}`,
        })
        await db.save('event_destination', [internalDestinationA, internalDestinationB])

        await eventDestinationService(app.log).trigger({
            event: buildFlowRunEvent({ platformId: ctx.platform.id, flowId: flowAId }),
        })

        expect(addSpy).not.toHaveBeenCalled()
    })

    it('should dispatch FLOW_RUN_FINISHED to a PROJECT scope destination matching the project', async () => {
        const ctx = await createTestContext(app)
        const destination = createMockEventDestination({
            platformId: ctx.platform.id,
            projectId: ctx.project.id,
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
            scope: EventDestinationScope.PROJECT,
            url: 'https://example.com/project-scope',
        })
        await db.save('event_destination', destination)

        await eventDestinationService(app.log).trigger({
            projectId: ctx.project.id,
            event: buildFlowRunEvent({ platformId: ctx.platform.id, projectId: ctx.project.id }),
        })

        expect(addSpy).toHaveBeenCalledTimes(1)
        expect(addSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ webhookUrl: destination.url }),
            }),
        )
    })

    it('should NOT dispatch to a PROJECT scope destination when projectId differs', async () => {
        const ctx = await createTestContext(app)
        const otherCtx = await createTestContext(app, { platform: { id: ctx.platform.id } })
        const destination = createMockEventDestination({
            platformId: ctx.platform.id,
            projectId: ctx.project.id,
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
            scope: EventDestinationScope.PROJECT,
            url: 'https://example.com/project-a',
        })
        await db.save('event_destination', destination)

        await eventDestinationService(app.log).trigger({
            projectId: otherCtx.project.id,
            event: buildFlowRunEvent({ platformId: ctx.platform.id, projectId: otherCtx.project.id }),
        })

        expect(addSpy).not.toHaveBeenCalled()
    })

    it('should NOT fan out non-FLOW_RUN_FINISHED events to PROJECT scope destinations', async () => {
        const ctx = await createTestContext(app)
        const destination = createMockEventDestination({
            platformId: ctx.platform.id,
            projectId: ctx.project.id,
            events: [ApplicationEventName.FLOW_CREATED],
            scope: EventDestinationScope.PROJECT,
            url: 'https://example.com/project-non-finished',
        })
        await db.save('event_destination', destination)

        await eventDestinationService(app.log).trigger({
            projectId: ctx.project.id,
            event: buildFlowEvent(ApplicationEventName.FLOW_CREATED, { platformId: ctx.platform.id, projectId: ctx.project.id }),
        })

        expect(addSpy).not.toHaveBeenCalled()
    })

    it('should ship the full event (action + data + envelope) as the queued payload', async () => {
        const ctx = await createTestContext(app)
        const destination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_CREATED],
            scope: EventDestinationScope.PLATFORM,
        })
        await db.save('event_destination', destination)

        const flowId = apId()
        const event = buildFlowEvent(ApplicationEventName.FLOW_CREATED, { platformId: ctx.platform.id, flowId })
        await eventDestinationService(app.log).trigger({
            event,
        })

        expect(addSpy).toHaveBeenCalledTimes(1)
        expect(addSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    payload: expect.objectContaining({
                        action: ApplicationEventName.FLOW_CREATED,
                        data: expect.objectContaining({ flow: expect.objectContaining({ id: flowId }) }),
                        platformId: ctx.platform.id,
                    }),
                }),
            }),
        )
    })

    it('regression: ensure that we have setup the event streaming listeners', async () => {
        const ctx = await createTestContext(app)
        const workerDestination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_RUN_FINISHED],
            scope: EventDestinationScope.PLATFORM,
            url: 'https://example.com/worker-listener-regression',
        })
        const userDestination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_CREATED],
            scope: EventDestinationScope.PLATFORM,
            url: 'https://example.com/user-listener-regression',
        })
        await db.save('event_destination', [workerDestination, userDestination])

        applicationEvents(app.log).sendWorkerEvent({
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
            action: ApplicationEventName.FLOW_RUN_FINISHED,
            data: {
                flowRun: {
                    id: apId(),
                    environment: 'PRODUCTION',
                    flowId: apId(),
                    flowVersionId: apId(),
                    stepNameToTest: null,
                    status: 'SUCCEEDED',
                },
                project: { displayName: 'Test' },
            },
        })
        applicationEvents(app.log).sendUserEvent({ platformId: ctx.platform.id }, {
            action: ApplicationEventName.FLOW_CREATED,
            data: {
                flow: {
                    id: apId(),
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                },
                project: { displayName: 'Test' },
            },
        })

        await vi.waitFor(() => expect(addSpy).toHaveBeenCalledTimes(2), { timeout: 2000 })
        expect(addSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ webhookUrl: workerDestination.url }),
            }),
        )
        expect(addSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ webhookUrl: userDestination.url }),
            }),
        )
    })

    it('should NOT skip a same-host destination for non flow-run events (e.g. FLOW_CREATED)', async () => {
        const ctx = await createTestContext(app)
        const flowId = apId()
        const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
            path: 'v1/webhooks',
        })
        const destination = createMockEventDestination({
            platformId: ctx.platform.id,
            events: [ApplicationEventName.FLOW_CREATED],
            scope: EventDestinationScope.PLATFORM,
            url: `${webhookUrlPrefix}/${flowId}`,
        })
        await db.save('event_destination', destination)

        await eventDestinationService(app.log).trigger({
            event: buildFlowEvent(ApplicationEventName.FLOW_CREATED, { platformId: ctx.platform.id, flowId }),
        })

        expect(addSpy).not.toHaveBeenCalled()
        expect(handleWebhookSpy).toHaveBeenCalledTimes(1)
        expect(handleWebhookSpy).toHaveBeenCalledWith(
            expect.objectContaining({ flowId }),
        )
    })

    describe('internal same-origin dispatch (GIT-1539)', () => {
        it('should dispatch internally to the handler flow instead of queueing an outbound HTTP job', async () => {
            const ctx = await createTestContext(app)
            const flowId = apId()
            const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
                path: 'v1/webhooks',
            })
            const destination = createMockEventDestination({
                platformId: ctx.platform.id,
                events: [ApplicationEventName.FLOW_CREATED],
                scope: EventDestinationScope.PLATFORM,
                url: `${webhookUrlPrefix}/${flowId}`,
            })
            await db.save('event_destination', destination)

            const event = buildFlowEvent(ApplicationEventName.FLOW_CREATED, { platformId: ctx.platform.id })
            await eventDestinationService(app.log).trigger({ event })

            expect(addSpy).not.toHaveBeenCalled()
            expect(handleWebhookSpy).toHaveBeenCalledTimes(1)
            expect(handleWebhookSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    flowId,
                    async: true,
                    execute: true,
                    saveSampleData: false,
                    failParentOnFailure: false,
                }),
            )
            const handleWebhookParams = handleWebhookSpy.mock.calls[0][0]
            const payload = await handleWebhookParams.data(ctx.project.id)
            expect(payload).toEqual({
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: event,
                queryParams: {},
            })
        })

        it('should dispatch internally when the internal URL carries a path suffix (e.g. /sync)', async () => {
            const ctx = await createTestContext(app)
            const flowId = apId()
            const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
                path: 'v1/webhooks',
            })
            const destination = createMockEventDestination({
                platformId: ctx.platform.id,
                events: [ApplicationEventName.FLOW_CREATED],
                scope: EventDestinationScope.PLATFORM,
                url: `${webhookUrlPrefix}/${flowId}/sync`,
            })
            await db.save('event_destination', destination)

            await eventDestinationService(app.log).trigger({
                event: buildFlowEvent(ApplicationEventName.FLOW_CREATED, { platformId: ctx.platform.id }),
            })

            expect(addSpy).not.toHaveBeenCalled()
            expect(handleWebhookSpy).toHaveBeenCalledTimes(1)
            expect(handleWebhookSpy).toHaveBeenCalledWith(
                expect.objectContaining({ flowId }),
            )
        })

        it('should dispatch same-origin /draft and /test route URLs internally with their own version/execute semantics', async () => {
            const ctx = await createTestContext(app)
            const draftFlowId = apId()
            const testFlowId = apId()
            const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
                path: 'v1/webhooks',
            })
            const draftDestination = createMockEventDestination({
                platformId: ctx.platform.id,
                events: [ApplicationEventName.FLOW_CREATED],
                scope: EventDestinationScope.PLATFORM,
                url: `${webhookUrlPrefix}/${draftFlowId}/draft`,
            })
            const testRouteDestination = createMockEventDestination({
                platformId: ctx.platform.id,
                events: [ApplicationEventName.FLOW_CREATED],
                scope: EventDestinationScope.PLATFORM,
                url: `${webhookUrlPrefix}/${testFlowId}/test`,
            })
            await db.save('event_destination', [draftDestination, testRouteDestination])

            await eventDestinationService(app.log).trigger({
                event: buildFlowEvent(ApplicationEventName.FLOW_CREATED, { platformId: ctx.platform.id }),
            })

            expect(addSpy).not.toHaveBeenCalled()
            expect(handleWebhookSpy).toHaveBeenCalledTimes(2)
            expect(handleWebhookSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    flowId: draftFlowId,
                    flowVersionToRun: WebhookFlowVersionToRun.LATEST,
                    saveSampleData: true,
                    execute: true,
                }),
            )
            expect(handleWebhookSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    flowId: testFlowId,
                    flowVersionToRun: WebhookFlowVersionToRun.LATEST,
                    saveSampleData: true,
                    execute: false,
                }),
            )
        })

        it('should drop a self-targeting same-origin destination on its own flow-run event (cycle guard)', async () => {
            const ctx = await createTestContext(app)
            const flowId = apId()
            const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
                path: 'v1/webhooks',
            })
            const destination = createMockEventDestination({
                platformId: ctx.platform.id,
                events: [ApplicationEventName.FLOW_RUN_FINISHED],
                scope: EventDestinationScope.PLATFORM,
                url: `${webhookUrlPrefix}/${flowId}/draft`,
            })
            await db.save('event_destination', destination)

            await eventDestinationService(app.log).trigger({
                event: buildFlowRunEvent({ platformId: ctx.platform.id, flowId }),
            })

            expect(addSpy).not.toHaveBeenCalled()
            expect(handleWebhookSpy).not.toHaveBeenCalled()
        })

        it('should forward the destination URL query params to the internal handler flow', async () => {
            const ctx = await createTestContext(app)
            const flowId = apId()
            const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
                path: 'v1/webhooks',
            })
            const destination = createMockEventDestination({
                platformId: ctx.platform.id,
                events: [ApplicationEventName.FLOW_CREATED],
                scope: EventDestinationScope.PLATFORM,
                url: `${webhookUrlPrefix}/${flowId}?token=abc&channel=alerts`,
            })
            await db.save('event_destination', destination)

            const event = buildFlowEvent(ApplicationEventName.FLOW_CREATED, { platformId: ctx.platform.id })
            await eventDestinationService(app.log).trigger({ event })

            expect(addSpy).not.toHaveBeenCalled()
            expect(handleWebhookSpy).toHaveBeenCalledTimes(1)
            const handleWebhookParams = handleWebhookSpy.mock.calls[0][0]
            const payload = await handleWebhookParams.data(ctx.project.id)
            expect(payload).toEqual({
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: event,
                queryParams: { token: 'abc', channel: 'alerts' },
            })
        })

        it('should NOT bypass outbound delivery for a webhook-shaped path on a different origin', async () => {
            const ctx = await createTestContext(app)
            const destination = createMockEventDestination({
                platformId: ctx.platform.id,
                events: [ApplicationEventName.FLOW_CREATED],
                scope: EventDestinationScope.PLATFORM,
                url: `https://attacker.example.com/api/v1/webhooks/${apId()}`,
            })
            await db.save('event_destination', destination)

            await eventDestinationService(app.log).trigger({
                event: buildFlowEvent(ApplicationEventName.FLOW_CREATED, { platformId: ctx.platform.id }),
            })

            expect(handleWebhookSpy).not.toHaveBeenCalled()
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

        it('should NOT bypass outbound delivery for a same-origin URL outside the webhook path prefix', async () => {
            const ctx = await createTestContext(app)
            const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
                path: 'v1/webhooks',
            })
            const origin = new URL(webhookUrlPrefix).origin
            const lookalikePathUrl = `${origin}/api/v1/webhooks-evil/${apId()}`
            const destination = createMockEventDestination({
                platformId: ctx.platform.id,
                events: [ApplicationEventName.FLOW_CREATED],
                scope: EventDestinationScope.PLATFORM,
                url: lookalikePathUrl,
            })
            await db.save('event_destination', destination)

            await eventDestinationService(app.log).trigger({
                event: buildFlowEvent(ApplicationEventName.FLOW_CREATED, { platformId: ctx.platform.id }),
            })

            expect(handleWebhookSpy).not.toHaveBeenCalled()
            expect(addSpy).toHaveBeenCalledTimes(1)
            expect(addSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ webhookUrl: lookalikePathUrl }),
                }),
            )
        })

        it('should surface (not throw) when the internal handler flow rejects the event', async () => {
            const ctx = await createTestContext(app)
            const flowId = apId()
            const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
                path: 'v1/webhooks',
            })
            handleWebhookSpy.mockResolvedValue({ status: 410, body: {}, headers: {} })
            const destination = createMockEventDestination({
                platformId: ctx.platform.id,
                events: [ApplicationEventName.FLOW_CREATED],
                scope: EventDestinationScope.PLATFORM,
                url: `${webhookUrlPrefix}/${flowId}`,
            })
            await db.save('event_destination', destination)

            await expect(eventDestinationService(app.log).trigger({
                event: buildFlowEvent(ApplicationEventName.FLOW_CREATED, { platformId: ctx.platform.id }),
            })).resolves.not.toThrow()

            expect(handleWebhookSpy).toHaveBeenCalledTimes(1)
            expect(addSpy).not.toHaveBeenCalled()
        })

        it('test() should dispatch internally for an internal URL and queue an outbound job for an external URL', async () => {
            const ctx = await createTestContext(app)
            const flowId = apId()
            const webhookUrlPrefix = await domainHelper.getPublicApiUrl({
                path: 'v1/webhooks',
            })

            await eventDestinationService(app.log).test({
                platformId: ctx.platform.id,
                url: `${webhookUrlPrefix}/${flowId}`,
            })
            expect(handleWebhookSpy).toHaveBeenCalledTimes(1)
            expect(handleWebhookSpy).toHaveBeenCalledWith(
                expect.objectContaining({ flowId, async: true }),
            )
            expect(addSpy).not.toHaveBeenCalled()

            await eventDestinationService(app.log).test({
                platformId: ctx.platform.id,
                url: 'https://example.com/external-hook',
            })
            expect(addSpy).toHaveBeenCalledTimes(1)
            expect(addSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        webhookUrl: 'https://example.com/external-hook',
                        jobType: WorkerJobType.EVENT_DESTINATION,
                    }),
                }),
            )
        })
    })
})
