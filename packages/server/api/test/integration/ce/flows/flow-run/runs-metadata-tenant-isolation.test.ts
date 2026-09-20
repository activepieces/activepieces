import { FlowRun, FlowRunStatus, FlowVersionState, RunEnvironment } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { engineRunCallbackService } from '../../../../../src/app/flows/flow-run/engine-run-callback-service'
import { distributedStore } from '../../../../../src/app/database/redis-connections'
import { runsMetadataQueue } from '../../../../../src/app/flows/flow-run/flow-runs-queue'
import { legacyRedisMetadataKey } from '../../../../../src/app/workers/job'
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

async function createFlow(projectId: string) {
    const flow = createMockFlow({ projectId })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED })
    await db.save('flow_version', flowVersion)
    return { flow, flowVersion }
}

async function createRunningFlowRun(projectId: string) {
    const { flow, flowVersion } = await createFlow(projectId)
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

// A rejected report is a non-event, and the queue's own counts are not a usable signal under
// the in-memory redis used in tests — a drain check there reports empty immediately and makes
// these assertions pass even with the guards removed. So the barrier is a later report from the
// run's own project: once its marker lands, the earlier foreign report has been processed too.
async function waitUntilTheOwnerReportLands({ flowRun, marker }: { flowRun: FlowRun, marker: string }): Promise<void> {
    await engineRunCallbackService(app.log).uploadRunLog({
        projectId: flowRun.projectId,
        request: { runId: flowRun.id, tags: [marker] },
    })
    await vi.waitUntil(
        async () => (await db.findOneBy<{ tags: string[] }>('flow_run', { id: flowRun.id }))?.tags?.includes(marker) === true,
        { timeout: 15_000, interval: 100 },
    )
}

describe('runs metadata tenant isolation', () => {
    it('does not let a report from another project rewrite an existing run', async () => {
        const { mockProject: attacker } = await mockAndSaveBasicSetup()
        const { mockProject: victim } = await mockAndSaveBasicSetup()
        const victimRun = await createRunningFlowRun(victim.id)

        await engineRunCallbackService(app.log).uploadRunLog({
            projectId: attacker.id,
            request: {
                runId: victimRun.id,
                status: FlowRunStatus.FAILED,
                finishTime: new Date().toISOString(),
            },
        })
        await waitUntilTheOwnerReportLands({ flowRun: victimRun, marker: 'barrier-update' })

        const run = await db.findOneBy<{ status: string, projectId: string }>('flow_run', { id: victimRun.id })
        expect(run?.status).toBe(FlowRunStatus.RUNNING)
        expect(run?.projectId).toBe(victim.id)
    }, 60_000)

    it('does not let a report poison the metadata another project later applies', async () => {
        const { mockProject: attacker } = await mockAndSaveBasicSetup()
        const { mockProject: victim } = await mockAndSaveBasicSetup()
        const victimRun = await createRunningFlowRun(victim.id)

        await engineRunCallbackService(app.log).uploadRunLog({
            projectId: attacker.id,
            request: {
                runId: victimRun.id,
                status: FlowRunStatus.FAILED,
                finishTime: new Date().toISOString(),
                failedStep: { name: 'step_1', displayName: 'Injected', message: 'injected by another project' },
            },
        })
        await waitUntilTheOwnerReportLands({ flowRun: victimRun, marker: 'barrier-poison' })

        const run = await db.findOneBy<{ status: string, failedStep: unknown }>('flow_run', { id: victimRun.id })
        expect(run?.status).toBe(FlowRunStatus.RUNNING)
        expect(run?.failedStep).toBeNull()
    }, 60_000)

    it('still applies metadata written under the pre-upgrade key, but only for its owner', async () => {
        const { mockProject: attacker } = await mockAndSaveBasicSetup()
        const { mockProject: victim } = await mockAndSaveBasicSetup()
        const ownedRun = await createRunningFlowRun(victim.id)
        const foreignRun = await createRunningFlowRun(victim.id)

        await distributedStore.merge(legacyRedisMetadataKey(ownedRun.id), {
            id: ownedRun.id, projectId: victim.id, status: FlowRunStatus.SUCCEEDED, requestId: 'legacy-owned',
        })
        await distributedStore.merge(legacyRedisMetadataKey(foreignRun.id), {
            id: foreignRun.id, projectId: attacker.id, status: FlowRunStatus.FAILED, requestId: 'legacy-foreign',
        })
        await runsMetadataQueue(app.log).get().add('update-run-metadata', { runId: ownedRun.id, projectId: victim.id })
        await runsMetadataQueue(app.log).get().add('update-run-metadata', { runId: foreignRun.id, projectId: victim.id })
        await vi.waitUntil(
            async () => (await db.findOneBy<{ status: string }>('flow_run', { id: ownedRun.id }))?.status === FlowRunStatus.SUCCEEDED,
            { timeout: 15_000, interval: 100 },
        )

        const owned = await db.findOneBy<{ status: string }>('flow_run', { id: ownedRun.id })
        const foreign = await db.findOneBy<{ status: string }>('flow_run', { id: foreignRun.id })
        expect(owned?.status).toBe(FlowRunStatus.SUCCEEDED)
        expect(foreign?.status).toBe(FlowRunStatus.RUNNING)
    }, 60_000)

    it('still applies a report from the run own project', async () => {
        const { mockProject } = await mockAndSaveBasicSetup()
        const flowRun = await createRunningFlowRun(mockProject.id)

        await engineRunCallbackService(app.log).uploadRunLog({
            projectId: mockProject.id,
            request: {
                runId: flowRun.id,
                status: FlowRunStatus.SUCCEEDED,
                finishTime: new Date().toISOString(),
            },
        })

        await vi.waitUntil(
            async () => (await db.findOneBy<{ status: string }>('flow_run', { id: flowRun.id }))?.status === FlowRunStatus.SUCCEEDED,
            { timeout: 10_000, interval: 100 },
        )
    }, 60_000)
})
