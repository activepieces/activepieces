import { apId } from '@activepieces/core-utils'
import { FlowRunStatus, FlowVersionState, RunEnvironment } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { markParentRunAsFailed } from '../../../../../src/app/flows/flow-run/flow-runs-queue'
import { db } from '../../../../helpers/db'
import { createMockFlow, createMockFlowVersion, createMockFlowRun, mockAndSaveBasicSetup } from '../../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function createPausedParentWithWaitpoint(projectId: string) {
    const flow = createMockFlow({ projectId })
    await db.save('flow', flow)

    const flowVersion = createMockFlowVersion({
        flowId: flow.id,
        state: FlowVersionState.LOCKED,
    })
    await db.save('flow_version', flowVersion)

    const flowRun = createMockFlowRun({
        projectId,
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        status: FlowRunStatus.PAUSED,
        environment: RunEnvironment.PRODUCTION,
    })
    await db.save('flow_run', flowRun)

    const waitpointId = apId()
    await db.save('waitpoint', {
        id: waitpointId,
        flowRunId: flowRun.id,
        projectId,
        stepName: 'approval',
        type: 'WEBHOOK',
        status: 'PENDING',
        httpRequestId: null,
        workerHandlerId: null,
    })

    return { flowRun, waitpointId }
}

describe('markParentRunAsFailed tenant isolation', () => {
    it('does not fail a parent run that belongs to another project', async () => {
        const { mockProject: projectA } = await mockAndSaveBasicSetup()
        const { mockProject: projectB } = await mockAndSaveBasicSetup()

        const { flowRun: victimRun, waitpointId } = await createPausedParentWithWaitpoint(projectB.id)

        await markParentRunAsFailed({
            parentRunId: victimRun.id,
            childRunId: apId(),
            projectId: projectA.id,
            log: app.log,
        })

        const waitpoint = await db.findOneBy<{ status: string }>('waitpoint', { id: waitpointId })
        expect(waitpoint?.status).toBe('PENDING')

        const run = await db.findOneBy<{ status: string }>('flow_run', { id: victimRun.id })
        expect(run?.status).toBe(FlowRunStatus.PAUSED)
    })

    it('fails a parent run in the same project', async () => {
        const { mockProject } = await mockAndSaveBasicSetup()

        const { flowRun: parentRun, waitpointId } = await createPausedParentWithWaitpoint(mockProject.id)

        await markParentRunAsFailed({
            parentRunId: parentRun.id,
            childRunId: apId(),
            projectId: mockProject.id,
            log: app.log,
        })

        const waitpoint = await db.findOneBy<{ status: string }>('waitpoint', { id: waitpointId })
        expect(waitpoint).toBeNull()
    })
})
