import { apId } from '@activepieces/core-utils'
import { FlowRetryStrategy, FlowRunStatus, FlowVersionState, McpServerType, ProjectScopedMcpServer, RunEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { flowRunService } from '../../../../src/app/flows/flow-run/flow-run-service'
import { apRetryRunTool } from '../../../../src/app/mcp/tools/ap-retry-run'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowRun, createMockFlowVersion } from '../../../helpers/mocks'
import { createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

vi.mock('../../../../src/app/mcp/tools/flow-run-utils', async (importOriginal) => {
    const original = await importOriginal<typeof import('../../../../src/app/mcp/tools/flow-run-utils')>()
    return {
        ...original,
        pollForRunCompletion: (log: FastifyBaseLogger, runId: string, projectId: string) =>
            flowRunService(log).getOnePopulatedOrThrow({ id: runId, projectId }),
    }
})

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('ap_retry_run', () => {
    it('tags the run it started so the chat can open it, and tags nothing it refused', async () => {
        const ctx = await createTestContext(app)
        const mcp = makeMcp(ctx.project.id)
        const failed = await saveRun({ ctx, status: FlowRunStatus.FAILED, displayName: 'Weekly report' })
        const succeeded = await saveRun({ ctx, status: FlowRunStatus.SUCCEEDED, displayName: 'Weekly report' })

        const retried = await apRetryRunTool(mcp, app.log).execute({ flowRunId: failed, strategy: FlowRetryStrategy.FROM_FAILED_STEP })
        const refused = await apRetryRunTool(mcp, app.log).execute({ flowRunId: succeeded, strategy: FlowRetryStrategy.FROM_FAILED_STEP })

        expect(retried._meta?.apResource).toEqual({ v: 1, kind: 'run', id: failed, projectId: ctx.project.id, op: 'create', label: 'Weekly report' })
        expect(refused._meta).toBeUndefined()
    })
})

function makeMcp(projectId: string): ProjectScopedMcpServer {
    return {
        id: apId(),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        projectId,
        platformId: null,
        type: McpServerType.PROJECT,
        token: apId(),
        disabledTools: null,
    }
}

async function saveRun({ ctx, status, displayName }: { ctx: TestContext, status: FlowRunStatus, displayName: string }): Promise<string> {
    const flow = createMockFlow({ projectId: ctx.project.id })
    await db.save('flow', flow)
    const flowVersion = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED, displayName })
    await db.save('flow_version', flowVersion)
    const flowRun = createMockFlowRun({
        projectId: ctx.project.id,
        flowId: flow.id,
        flowVersionId: flowVersion.id,
        status,
        environment: RunEnvironment.PRODUCTION,
        created: new Date().toISOString(),
    })
    await db.save('flow_run', flowRun)
    return flowRun.id
}
