import { FlowRunStatus, FlowVersionState, RunEnvironment } from '@activepieces/shared'
import { FastifyInstance, LightMyRequestResponse } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowRun, createMockFlowVersion, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Admin retry runs (POST /v1/admin/platforms/runs/retry)', () => {
    it('retries every run inside the date window when runIds is omitted', async () => {
        const center = Date.now() - 3 * DAY_MS
        const { mockProject } = await mockAndSaveBasicSetup()
        const before = await createFailedRun({ projectId: mockProject.id, createdAt: center - 2 * HOUR_MS })
        const inside = await createFailedRun({ projectId: mockProject.id, createdAt: center })
        const { mockProject: otherProject } = await mockAndSaveBasicSetup()
        const insideOtherProject = await createFailedRun({ projectId: otherProject.id, createdAt: center })
        const after = await createFailedRun({ projectId: mockProject.id, createdAt: center + 2 * HOUR_MS })

        const response = await retryRuns({
            createdAfter: new Date(center - HOUR_MS).toISOString(),
            createdBefore: new Date(center + HOUR_MS).toISOString(),
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(await readStatus(inside)).toBe(FlowRunStatus.QUEUED)
        expect(await readStatus(insideOtherProject)).toBe(FlowRunStatus.QUEUED)
        expect(await readStatus(before)).toBe(FlowRunStatus.FAILED)
        expect(await readStatus(after)).toBe(FlowRunStatus.FAILED)
    })

    it('retries only the given runIds that fall inside the date window', async () => {
        const center = Date.now() - 2 * DAY_MS
        const { mockProject } = await mockAndSaveBasicSetup()
        const insideListed = await createFailedRun({ projectId: mockProject.id, createdAt: center })
        const insideUnlisted = await createFailedRun({ projectId: mockProject.id, createdAt: center })
        const outsideListed = await createFailedRun({ projectId: mockProject.id, createdAt: center + 2 * HOUR_MS })

        const response = await retryRuns({
            createdAfter: new Date(center - HOUR_MS).toISOString(),
            createdBefore: new Date(center + HOUR_MS).toISOString(),
            runIds: [insideListed, outsideListed],
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(await readStatus(insideListed)).toBe(FlowRunStatus.QUEUED)
        expect(await readStatus(insideUnlisted)).toBe(FlowRunStatus.FAILED)
        expect(await readStatus(outsideListed)).toBe(FlowRunStatus.FAILED)
    })

    it('retries nothing when runIds is an empty list', async () => {
        const center = Date.now() - DAY_MS
        const { mockProject } = await mockAndSaveBasicSetup()
        const inside = await createFailedRun({ projectId: mockProject.id, createdAt: center })

        const response = await retryRuns({
            createdAfter: new Date(center - HOUR_MS).toISOString(),
            createdBefore: new Date(center + HOUR_MS).toISOString(),
            runIds: [],
        })

        expect(response.statusCode).toBe(StatusCodes.OK)
        expect(await readStatus(inside)).toBe(FlowRunStatus.FAILED)
    })
})

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

async function retryRuns(body: { createdAfter: string, createdBefore: string, runIds?: string[] }): Promise<LightMyRequestResponse> {
    return app.inject({
        method: 'POST',
        url: '/api/v1/admin/platforms/runs/retry',
        headers: { 'api-key': process.env['AP_API_KEY'] ?? '' },
        body,
    })
}

async function createFailedRun({ projectId, createdAt }: { projectId: string, createdAt: number }): Promise<string> {
    const flow = createMockFlow({ projectId })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED })
    await db.save('flow_version', flowVersion)
    const run = createMockFlowRun({
        projectId,
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        status: FlowRunStatus.FAILED,
        environment: RunEnvironment.PRODUCTION,
    })
    await db.save('flow_run', run)
    await databaseConnection().query('UPDATE flow_run SET created = $1 WHERE id = $2', [new Date(createdAt).toISOString(), run.id])
    return run.id
}

async function readStatus(runId: string): Promise<FlowRunStatus> {
    const row = await db.findOneByOrFail<{ status: FlowRunStatus }>('flow_run', { id: runId })
    return row.status
}
