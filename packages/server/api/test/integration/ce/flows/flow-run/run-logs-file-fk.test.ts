import { apId } from '@activepieces/core-utils'
import { ApEdition, FileCompression, FileType, FlowRunStatus, FlowVersionState, RunEnvironment, RunInternalErrorSource } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterEach, vi } from 'vitest'
import { engineRunCallbackService } from '../../../../../src/app/flows/flow-run/engine-run-callback-service'
import { fileService } from '../../../../../src/app/file/file.service'
import { system } from '../../../../../src/app/helper/system/system'
import { db } from '../../../../helpers/db'
import { createMockFlow, createMockFlowRun, createMockFlowVersion } from '../../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../../helpers/test-setup'

async function waitForCondition(fn: () => Promise<boolean>, timeoutMs = 5000): Promise<void> {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
        if (await fn()) {
            return
        }
        await new Promise((resolve) => setTimeout(resolve, 100))
    }
    throw new Error('waitForCondition timed out')
}

async function createRunningFlowRun(params: { projectId: string, logsFileId?: string }): Promise<{ runId: string }> {
    const flow = createMockFlow({ projectId: params.projectId })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED })
    await db.save('flow_version', flowVersion)
    const flowRun = createMockFlowRun({
        projectId: params.projectId,
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        status: FlowRunStatus.RUNNING,
        environment: RunEnvironment.PRODUCTION,
        logsFileId: params.logsFileId,
    })
    await db.save('flow_run', flowRun)
    return { runId: flowRun.id }
}

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

afterEach(() => {
    vi.restoreAllMocks()
})

describe('uploadRunLog — flow_run.logsFileId FK safety', () => {
    it('backs logsFileId with a created file on a Cloud worker internal error, so the FK never dangles', async () => {
        vi.spyOn(system, 'getEdition').mockReturnValue(ApEdition.CLOUD)
        const { runId } = await createRunningFlowRun({ projectId: ctx.project.id })

        // Cloud + worker-source internal error: the engine never uploaded a log file for this logsFileId.
        // uploadRunLog must materialize the file before referencing it, otherwise fk_flow_run_logs_file_id throws.
        await engineRunCallbackService(app.log).uploadRunLog({
            projectId: ctx.project.id,
            request: {
                runId,
                projectId: ctx.project.id,
                status: FlowRunStatus.INTERNAL_ERROR,
                logsFileId: apId(),
                internalError: {
                    source: RunInternalErrorSource.WORKER,
                    message: 'sandbox provisioning failed',
                    occurredAt: new Date().toISOString(),
                },
            },
        })

        await waitForCondition(async () => {
            const run = await db.findOneBy<{ status: string }>('flow_run', { id: runId })
            return run?.status === FlowRunStatus.INTERNAL_ERROR
        })

        const run = await db.findOneBy<{ status: string, logsFileId: string | null }>('flow_run', { id: runId })
        expect(run?.status).toBe(FlowRunStatus.INTERNAL_ERROR)
        // No FK violation: the run row updated and logsFileId points at a file that was created on demand.
        expect(run?.logsFileId).not.toBeNull()
        const fileExists = await fileService(app.log).exists({ projectId: ctx.project.id, fileId: run!.logsFileId!, type: FileType.FLOW_RUN_LOG })
        expect(fileExists).toBe(true)
    })

    it('links logsFileId when the log file exists (engine backup path)', async () => {
        const data = Buffer.from(JSON.stringify({ executionState: { steps: {}, tags: [] } }), 'utf-8')
        const logFile = await fileService(app.log).save({
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
            type: FileType.FLOW_RUN_LOG,
            data,
            size: data.length,
            compression: FileCompression.NONE,
        })
        const { runId } = await createRunningFlowRun({ projectId: ctx.project.id })

        await engineRunCallbackService(app.log).uploadRunLog({
            projectId: ctx.project.id,
            request: {
                runId,
                projectId: ctx.project.id,
                status: FlowRunStatus.SUCCEEDED,
                logsFileId: logFile.id,
            },
        })

        await waitForCondition(async () => {
            const run = await db.findOneBy<{ logsFileId: string | null }>('flow_run', { id: runId })
            return run?.logsFileId === logFile.id
        })

        const run = await db.findOneBy<{ status: string, logsFileId: string | null }>('flow_run', { id: runId })
        expect(run?.logsFileId).toBe(logFile.id)
        expect(run?.status).toBe(FlowRunStatus.SUCCEEDED)
    })
})
