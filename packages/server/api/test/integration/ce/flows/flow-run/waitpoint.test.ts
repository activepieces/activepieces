import { apId, FlowRunStatus, FlowVersionState, PauseType, RunEnvironment } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { waitpointService } from '../../../../../src/app/flows/flow-run/waitpoint/waitpoint-service'
import { WaitpointStatus } from '../../../../../src/app/flows/flow-run/waitpoint/waitpoint-types'
import { createTestContext, TestContext } from '../../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'
import { createMockFlow, createMockFlowRun, createMockFlowVersion } from '../../../../helpers/mocks'
import { db } from '../../../../helpers/db'

let app: FastifyInstance
let ctx: TestContext

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    ctx = await createTestContext(app)
})

async function createFlowRun(params?: { status?: FlowRunStatus }) {
    const flow = createMockFlow({ projectId: ctx.project.id })
    await db.save('flow', flow)

    const flowVersion = createMockFlowVersion({
        flowId: flow.id,
        state: FlowVersionState.LOCKED,
    })
    await db.save('flow_version', flowVersion)

    const flowRun = createMockFlowRun({
        projectId: ctx.project.id,
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        status: params?.status ?? FlowRunStatus.PAUSED,
        environment: RunEnvironment.PRODUCTION,
    })
    await db.save('flow_run', flowRun)

    return { flow, flowVersion, flowRun }
}

describe('Waitpoint service', () => {
    describe('createForPause', () => {
        it('should create a PENDING waitpoint when none exists', async () => {
            const { flowRun } = await createFlowRun()

            const result = await waitpointService(app.log).createForPause({
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                stepName: 'approval',
                type: PauseType.WEBHOOK,
            })

            expect(result.inserted).toBe(true)
            expect(result.waitpoint.status).toBe(WaitpointStatus.PENDING)
            expect(result.waitpoint.flowRunId).toBe(flowRun.id)
            expect(result.waitpoint.type).toBe(PauseType.WEBHOOK)
        })

        it('should return pre-completed waitpoint when resume arrived first', async () => {
            const { flowRun } = await createFlowRun()

            await waitpointService(app.log).complete({
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                waitpointId: apId(),
                resumePayload: { body: { data: 'test' } },
            })

            const result = await waitpointService(app.log).createForPause({
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                stepName: 'approval',
                type: PauseType.WEBHOOK,
            })

            expect(result.inserted).toBe(false)
            expect(result.waitpoint.status).toBe(WaitpointStatus.COMPLETED)
            expect(result.waitpoint.resumePayload).toEqual({ body: { data: 'test' } })
        })

        it('should correctly map DELAY pause fields', async () => {
            const { flowRun } = await createFlowRun()
            const resumeAt = new Date(Date.now() + 60000).toISOString()

            const result = await waitpointService(app.log).createForPause({
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                stepName: 'delay_step',
                type: PauseType.DELAY,
                resumeDateTime: resumeAt,
                workerHandlerId: 'server-1',
                httpRequestId: 'reply-1',
            })

            expect(result.inserted).toBe(true)
            expect(result.waitpoint.type).toBe(PauseType.DELAY)
            expect(new Date(result.waitpoint.resumeDateTime!).toISOString()).toBe(resumeAt)
            expect(result.waitpoint.workerHandlerId).toBe('server-1')
            expect(result.waitpoint.httpRequestId).toBe('reply-1')
        })

        it('should correctly map WEBHOOK pause fields', async () => {
            const { flowRun } = await createFlowRun()

            const result = await waitpointService(app.log).createForPause({
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                stepName: 'webhook_step',
                type: PauseType.WEBHOOK,
                responseToSend: { status: 200, body: 'ok' },
                workerHandlerId: 'server-2',
            })

            expect(result.inserted).toBe(true)
            expect(result.waitpoint.type).toBe(PauseType.WEBHOOK)
            expect(result.waitpoint.responseToSend).toEqual({ status: 200, body: 'ok' })
            expect(result.waitpoint.workerHandlerId).toBe('server-2')
        })
    })

    describe('complete', () => {
        it('should complete existing PENDING waitpoint', async () => {
            const { flowRun } = await createFlowRun()

            const pauseResult = await waitpointService(app.log).createForPause({
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                stepName: 'approval',
                type: PauseType.WEBHOOK,
            })

            const result = await waitpointService(app.log).complete({
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                waitpointId: pauseResult.waitpoint.id,
                resumePayload: { body: { greeting: 'Hello' } },
            })

            expect(result.completedExisting).toBe(true)
            expect(result.waitpoint.status).toBe(WaitpointStatus.COMPLETED)
            expect(result.waitpoint.resumePayload).toEqual({ body: { greeting: 'Hello' } })
        })

        it('should pre-complete when no waitpoint exists (race condition)', async () => {
            const { flowRun } = await createFlowRun({ status: FlowRunStatus.RUNNING })

            const result = await waitpointService(app.log).complete({
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                waitpointId: apId(),
                resumePayload: { body: { status: 'error' } },
            })

            expect(result.completedExisting).toBe(false)

            const stored = await db.findOneBy<{ status: string, resumePayload: unknown }>('waitpoint', { flowRunId: flowRun.id })
            expect(stored).not.toBeNull()
            expect(stored!.status).toBe('COMPLETED')
            expect(stored!.resumePayload).toEqual({ body: { status: 'error' } })
        })

        it('should be idempotent — completing an already-COMPLETED waitpoint is a no-op', async () => {
            const { flowRun } = await createFlowRun()
            const firstWaitpointId = apId()

            await waitpointService(app.log).complete({
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                waitpointId: firstWaitpointId,
                resumePayload: { body: { first: true } },
            })

            const result = await waitpointService(app.log).complete({
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                waitpointId: apId(),
                resumePayload: { body: { second: true } },
            })

            expect(result.completedExisting).toBe(false)

            const stored = await db.findOneBy<{ resumePayload: unknown }>('waitpoint', { flowRunId: flowRun.id })
            expect(stored!.resumePayload).toEqual({ body: { first: true } })
        })
    })

    describe('deleteByFlowRunId', () => {
        it('should delete waitpoint and allow creating a new one for next pause cycle', async () => {
            const { flowRun } = await createFlowRun()

            await waitpointService(app.log).createForPause({
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                stepName: 'approval',
                type: PauseType.WEBHOOK,
            })

            await waitpointService(app.log).deleteByFlowRunId(flowRun.id)

            const deleted = await db.findOneBy('waitpoint', { flowRunId: flowRun.id })
            expect(deleted).toBeNull()

            const result = await waitpointService(app.log).createForPause({
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                stepName: 'delay_step',
                type: PauseType.DELAY,
                resumeDateTime: new Date().toISOString(),
            })

            expect(result.inserted).toBe(true)
            expect(result.waitpoint.type).toBe(PauseType.DELAY)
        })
    })

    describe('getByFlowRunId', () => {
        it('should return null when no waitpoint exists', async () => {
            const result = await waitpointService(app.log).getByFlowRunId(apId())
            expect(result).toBeNull()
        })

        it('should return the waitpoint when it exists', async () => {
            const { flowRun } = await createFlowRun()

            await waitpointService(app.log).createForPause({
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                stepName: 'approval',
                type: PauseType.WEBHOOK,
            })

            const result = await waitpointService(app.log).getByFlowRunId(flowRun.id)
            expect(result).not.toBeNull()
            expect(result!.flowRunId).toBe(flowRun.id)
        })
    })

    describe('concurrent complete calls', () => {
        it('should handle two concurrent complete calls safely', async () => {
            const { flowRun } = await createFlowRun({ status: FlowRunStatus.RUNNING })

            const [result1, result2] = await Promise.all([
                waitpointService(app.log).complete({
                    flowRunId: flowRun.id,
                    projectId: ctx.project.id,
                    waitpointId: apId(),
                    resumePayload: { body: { first: true } },
                }),
                waitpointService(app.log).complete({
                    flowRunId: flowRun.id,
                    projectId: ctx.project.id,
                    waitpointId: apId(),
                    resumePayload: { body: { second: true } },
                }),
            ])

            const completedCount = [result1.completedExisting, result2.completedExisting].filter(Boolean).length
            expect(completedCount).toBeLessThanOrEqual(1)

            const stored = await db.findOneBy<{ status: string }>('waitpoint', { flowRunId: flowRun.id })
            expect(stored).not.toBeNull()
            expect(stored!.status).toBe('COMPLETED')
        })
    })

    describe('handleResumeSignal', () => {
        it('should call onReady and delete waitpoint when flow is PAUSED', async () => {
            const { flowRun } = await createFlowRun({ status: FlowRunStatus.PAUSED })

            const pauseResult = await waitpointService(app.log).createForPause({
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                stepName: 'approval',
                type: PauseType.WEBHOOK,
            })

            let calledWith: { workerHandlerId: string | null } | null = null
            const result = await waitpointService(app.log).handleResumeSignal({
                flowRunId: flowRun.id,
                waitpointId: pauseResult.waitpoint.id,
                flowRunStatus: FlowRunStatus.PAUSED,
                projectId: ctx.project.id,
                resumePayload: null,
                onReady: async (waitpoint) => {
                    calledWith = { workerHandlerId: waitpoint.workerHandlerId }
                },
            })

            expect(result).toBe(true)
            expect(calledWith).not.toBeNull()
            const deleted = await db.findOneBy('waitpoint', { flowRunId: flowRun.id })
            expect(deleted).toBeNull()
        })

        it('should buffer resume data when flow is RUNNING', async () => {
            const { flowRun } = await createFlowRun({ status: FlowRunStatus.RUNNING })

            let onReadyCalled = false
            const result = await waitpointService(app.log).handleResumeSignal({
                flowRunId: flowRun.id,
                waitpointId: apId(),
                flowRunStatus: FlowRunStatus.RUNNING,
                projectId: ctx.project.id,
                resumePayload: { body: { msg: 'hello' } },
                onReady: async () => {
                    onReadyCalled = true
                },
            })

            expect(result).toBe(true)
            expect(onReadyCalled).toBe(false)
            const waitpoint = await db.findOneBy<{ status: string, resumePayload: unknown }>('waitpoint', { flowRunId: flowRun.id })
            expect(waitpoint).not.toBeNull()
            expect(waitpoint!.status).toBe('COMPLETED')
        })

        it('should be a no-op when flow is in terminal state', async () => {
            const { flowRun } = await createFlowRun({ status: FlowRunStatus.SUCCEEDED })

            let onReadyCalled = false
            const result = await waitpointService(app.log).handleResumeSignal({
                flowRunId: flowRun.id,
                waitpointId: apId(),
                flowRunStatus: FlowRunStatus.SUCCEEDED,
                projectId: ctx.project.id,
                resumePayload: null,
                onReady: async () => {
                    onReadyCalled = true
                },
            })

            expect(result).toBe(false)
            expect(onReadyCalled).toBe(false)
            const waitpoint = await db.findOneBy('waitpoint', { flowRunId: flowRun.id })
            expect(waitpoint).toBeNull()
        })

        it('should return false and not call onReady when waitpointId is stale', async () => {
            const { flowRun } = await createFlowRun({ status: FlowRunStatus.PAUSED })

            await waitpointService(app.log).createForPause({
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                stepName: 'approval',
                type: PauseType.WEBHOOK,
            })

            let onReadyCalled = false
            const result = await waitpointService(app.log).handleResumeSignal({
                flowRunId: flowRun.id,
                waitpointId: apId(),
                flowRunStatus: FlowRunStatus.PAUSED,
                projectId: ctx.project.id,
                resumePayload: null,
                onReady: async () => {
                    onReadyCalled = true
                },
            })

            expect(result).toBe(false)
            expect(onReadyCalled).toBe(false)
            const waitpoint = await db.findOneBy('waitpoint', { flowRunId: flowRun.id })
            expect(waitpoint).not.toBeNull()
        })

        it('should not complete wrong waitpoint when delay fires with stale waitpointId', async () => {
            const { flowRun } = await createFlowRun({ status: FlowRunStatus.PAUSED })

            const delayPause = await waitpointService(app.log).createForPause({
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                stepName: 'delay_step',
                type: PauseType.DELAY,
                resumeDateTime: new Date(Date.now() + 60000).toISOString(),
            })
            const staleWaitpointId = delayPause.waitpoint.id

            // Simulate: delay resolved early, flow continued and paused on approval (new waitpoint)
            await waitpointService(app.log).deleteByFlowRunId(flowRun.id)
            const approvalPause = await waitpointService(app.log).createForPause({
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                stepName: 'approval_step',
                type: PauseType.WEBHOOK,
            })

            // Stale delay job fires with old waitpointId — should NOT resume the approval step
            const result = await waitpointService(app.log).handleResumeSignal({
                flowRunId: flowRun.id,
                waitpointId: staleWaitpointId,
                flowRunStatus: FlowRunStatus.PAUSED,
                projectId: ctx.project.id,
                resumePayload: null,
                onReady: async () => {
                    throw new Error('Should not resume wrong waitpoint')
                },
            })

            expect(result).toBe(false)
            // Approval waitpoint should still be intact
            const waitpoint = await db.findOneBy<{ id: string, stepName: string }>('waitpoint', { flowRunId: flowRun.id })
            expect(waitpoint).not.toBeNull()
            expect(waitpoint!.id).toBe(approvalPause.waitpoint.id)
            expect(waitpoint!.stepName).toBe('approval_step')
        })
    })

    describe('complete with waitpointId', () => {
        it('should complete specific waitpoint when waitpointId matches', async () => {
            const { flowRun } = await createFlowRun()

            const pauseResult = await waitpointService(app.log).createForPause({
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                stepName: 'approval',
                type: PauseType.WEBHOOK,
            })

            const completeResult = await waitpointService(app.log).complete({
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                waitpointId: pauseResult.waitpoint.id,
                resumePayload: { body: { approved: true } },
            })

            expect(completeResult.completedExisting).toBe(true)
            expect(completeResult.waitpoint.id).toBe(pauseResult.waitpoint.id)
        })

    })

    describe('findPendingByVersion', () => {
        it('should return pending V0 waitpoint when one exists', async () => {
            const { flowRun } = await createFlowRun()

            await db.save('waitpoint', {
                id: apId(),
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                stepName: 'approval',
                type: 'WEBHOOK',
                version: 'V0',
                status: 'PENDING',
                httpRequestId: null,
                workerHandlerId: null,
            })

            const result = await waitpointService(app.log).findPendingByVersion({ flowRunId: flowRun.id, version: 'V0' })
            expect(result).not.toBeNull()
            expect(result!.flowRunId).toBe(flowRun.id)
            expect(result!.version).toBe('V0')
        })

        it('should return null when only a V1 waitpoint exists', async () => {
            const { flowRun } = await createFlowRun()

            await db.save('waitpoint', {
                id: apId(),
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                stepName: 'approval',
                type: 'WEBHOOK',
                version: 'V1',
                status: 'PENDING',
                httpRequestId: null,
                workerHandlerId: null,
            })

            const result = await waitpointService(app.log).findPendingByVersion({ flowRunId: flowRun.id, version: 'V0' })
            expect(result).toBeNull()
        })

        it('should return null when waitpoint is COMPLETED', async () => {
            const { flowRun } = await createFlowRun()

            await db.save('waitpoint', {
                id: apId(),
                flowRunId: flowRun.id,
                projectId: ctx.project.id,
                stepName: 'approval',
                type: 'WEBHOOK',
                version: 'V0',
                status: 'COMPLETED',
                httpRequestId: null,
                workerHandlerId: null,
            })

            const result = await waitpointService(app.log).findPendingByVersion({ flowRunId: flowRun.id, version: 'V0' })
            expect(result).toBeNull()
        })
    })
})
