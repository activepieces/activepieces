import { FlowRunStatus, FlowVersionState, RunEnvironment } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../../src/app/database/database-connection'
import { stuckRunSweeper } from '../../../../../src/app/flows/flow-run/stuck-run-sweeper'
import { db } from '../../../../helpers/db'
import { describeWithAuth } from '../../../../helpers/describe-with-auth'
import { createMockFlow, createMockFlowRun, createMockFlowVersion } from '../../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function seedRun({ projectId, status, updatedAt, archivedAt }: {
    projectId: string
    status: FlowRunStatus
    updatedAt: string
    archivedAt?: string
}): Promise<string> {
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
        status,
        environment: RunEnvironment.PRODUCTION,
    })
    await db.save('flow_run', flowRun)

    await databaseConnection().query(
        'UPDATE flow_run SET updated = $1, "finishTime" = NULL, "archivedAt" = $2 WHERE id = $3',
        [updatedAt, archivedAt ?? null, flowRun.id],
    )
    return flowRun.id
}

async function readRun(runId: string): Promise<{ status: FlowRunStatus, finishTime: string | null }> {
    return db.findOneByOrFail<{ status: FlowRunStatus, finishTime: string | null }>('flow_run', { id: runId })
}

async function waitForStatus({ runId, expected, timeoutMs = 10_000 }: {
    runId: string
    expected: FlowRunStatus
    timeoutMs?: number
}): Promise<void> {
    const start = Date.now()
    let last = (await readRun(runId)).status
    while (last !== expected && Date.now() - start < timeoutMs) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        last = (await readRun(runId)).status
    }
    expect(last).toBe(expected)
}

describeWithAuth('Stuck run sweep', () => app!, (setup) => {
    it('should finalize a stale RUNNING run as TIMEOUT and leave live and non-RUNNING runs untouched', async () => {
        const ctx = await setup()
        const staleUpdated = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const freshUpdated = new Date().toISOString()

        const staleRunning = await seedRun({ projectId: ctx.project.id, status: FlowRunStatus.RUNNING, updatedAt: staleUpdated })
        const freshRunning = await seedRun({ projectId: ctx.project.id, status: FlowRunStatus.RUNNING, updatedAt: freshUpdated })
        const stalePaused = await seedRun({ projectId: ctx.project.id, status: FlowRunStatus.PAUSED, updatedAt: staleUpdated })
        const staleQueued = await seedRun({ projectId: ctx.project.id, status: FlowRunStatus.QUEUED, updatedAt: staleUpdated })
        const staleArchived = await seedRun({ projectId: ctx.project.id, status: FlowRunStatus.RUNNING, updatedAt: staleUpdated, archivedAt: new Date().toISOString() })

        await stuckRunSweeper(app!.log).sweep()

        await waitForStatus({ runId: staleRunning, expected: FlowRunStatus.TIMEOUT })
        const sweptRun = await readRun(staleRunning)
        expect(sweptRun.finishTime).not.toBeNull()

        expect((await readRun(freshRunning)).status).toBe(FlowRunStatus.RUNNING)
        expect((await readRun(stalePaused)).status).toBe(FlowRunStatus.PAUSED)
        expect((await readRun(staleQueued)).status).toBe(FlowRunStatus.QUEUED)
        expect((await readRun(staleArchived)).status).toBe(FlowRunStatus.RUNNING)
    })
})
