import { FlowRunStatus, FlowVersionState, RunEnvironment } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { engineRunCallbackService } from '../../../../../src/app/flows/flow-run/engine-run-callback-service'
import { db } from '../../../../helpers/db'
import { createMockFlow, createMockFlowRun, createMockFlowVersion, mockAndSaveBasicSetup } from '../../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function createRunningFlowRun(projectId: string) {
    const flow = createMockFlow({ projectId })
    await db.save('flow', flow)

    const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED })
    await db.save('flow_version', flowVersion)

    const flowRun = createMockFlowRun({
        projectId,
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        status: FlowRunStatus.RUNNING,
        environment: RunEnvironment.PRODUCTION,
        finishTime: null,
    })
    await db.save('flow_run', flowRun)
    return flowRun
}

async function waitForMetadataToSettle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 3000))
}

describe('runs metadata tenant isolation', () => {
    it('does not let a report from one project rewrite a run in another', async () => {
        const { mockProject: attacker } = await mockAndSaveBasicSetup()
        const { mockProject: victim } = await mockAndSaveBasicSetup()

        const victimRun = await createRunningFlowRun(victim.id)

        await engineRunCallbackService(app.log).uploadRunLog({
            projectId: attacker.id,
            request: {
                runId: victimRun.id,
                projectId: attacker.id,
                status: FlowRunStatus.FAILED,
                finishTime: new Date().toISOString(),
            },
        })
        await waitForMetadataToSettle()

        const run = await db.findOneBy<{ status: string, projectId: string }>('flow_run', { id: victimRun.id })
        expect(run?.status).toBe(FlowRunStatus.RUNNING)
        expect(run?.projectId).toBe(victim.id)
    }, 60_000)

    it('still applies a report from the run own project', async () => {
        const { mockProject } = await mockAndSaveBasicSetup()
        const flowRun = await createRunningFlowRun(mockProject.id)

        await engineRunCallbackService(app.log).uploadRunLog({
            projectId: mockProject.id,
            request: {
                runId: flowRun.id,
                projectId: mockProject.id,
                status: FlowRunStatus.SUCCEEDED,
                finishTime: new Date().toISOString(),
            },
        })
        await waitForMetadataToSettle()

        const run = await db.findOneBy<{ status: string }>('flow_run', { id: flowRun.id })
        expect(run?.status).toBe(FlowRunStatus.SUCCEEDED)
    }, 60_000)
})
