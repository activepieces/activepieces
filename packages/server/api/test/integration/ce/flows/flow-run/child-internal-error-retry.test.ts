import { apId } from '@activepieces/core-utils'
import { FlowRunStatus, FlowVersionState, RunEnvironment } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { engineRunCallbackService } from '../../../../../src/app/flows/flow-run/engine-run-callback-service'
import { db } from '../../../../helpers/db'
import { createMockFlow, createMockFlowRun, createMockFlowVersion, createMockWaitpoint, mockAndSaveBasicSetup } from '../../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function createParentWithPausedWaitpointAndChild(projectId: string) {
    const flow = createMockFlow({ projectId })
    await db.save('flow', flow)

    const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED })
    await db.save('flow_version', flowVersion)

    const parentRun = createMockFlowRun({
        projectId,
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        status: FlowRunStatus.PAUSED,
        environment: RunEnvironment.PRODUCTION,
    })
    await db.save('flow_run', parentRun)

    const waitpoint = createMockWaitpoint({ flowRunId: parentRun.id, projectId, stepName: 'step_1' })
    await db.save('waitpoint', waitpoint)

    const childRun = createMockFlowRun({
        projectId,
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        status: FlowRunStatus.RUNNING,
        environment: RunEnvironment.PRODUCTION,
        parentRunId: parentRun.id,
        failParentOnFailure: true,
        finishTime: null,
    })
    await db.save('flow_run', childRun)

    return { parentRun, childRun, waitpointId: waitpoint.id }
}

async function reportChildInternalError({ projectId, childRunId, willRetry }: { projectId: string, childRunId: string, willRetry: boolean }) {
    await engineRunCallbackService(app.log).uploadRunLog({
        projectId,
        request: {
            runId: childRunId,
            projectId,
            status: FlowRunStatus.INTERNAL_ERROR,
            finishTime: new Date().toISOString(),
            willRetry,
        },
    })
}

describe('child run INTERNAL_ERROR with a pending queue retry', () => {
    it('leaves the parent paused while the child job still has an attempt left', async () => {
        const { mockProject } = await mockAndSaveBasicSetup()
        const { parentRun, childRun, waitpointId } = await createParentWithPausedWaitpointAndChild(mockProject.id)

        await reportChildInternalError({ projectId: mockProject.id, childRunId: childRun.id, willRetry: true })
        await new Promise((resolve) => setTimeout(resolve, 3000))

        const waitpoint = await db.findOneBy<{ status: string }>('waitpoint', { id: waitpointId })
        expect(waitpoint?.status).toBe('PENDING')

        const parent = await db.findOneBy<{ status: string }>('flow_run', { id: parentRun.id })
        expect(parent?.status).toBe(FlowRunStatus.PAUSED)
    }, 60_000)

    it('fails the parent once the child job has no attempt left', async () => {
        const { mockProject } = await mockAndSaveBasicSetup()
        const { childRun, waitpointId } = await createParentWithPausedWaitpointAndChild(mockProject.id)

        await reportChildInternalError({ projectId: mockProject.id, childRunId: childRun.id, willRetry: false })

        await vi.waitUntil(
            async () => await db.findOneBy('waitpoint', { id: waitpointId }) === null,
            { timeout: 10_000, interval: 250 },
        )
    }, 60_000)
})
