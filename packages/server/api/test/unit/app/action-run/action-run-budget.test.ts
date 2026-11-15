import { CodeAction, FlowActionType, FlowRunStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const submitAndWaitForResponse = vi.fn()

vi.mock('../../../../src/app/workers/user-interaction-watcher', () => ({
    userInteractionWatcher: { submitAndWaitForResponse: (...args: unknown[]) => submitAndWaitForResponse(...args) },
}))
vi.mock('../../../../src/app/workers/job-queue/job-queue', () => ({
    jobQueue: () => ({ cancelAndReportNeverStarted: vi.fn() }),
}))
vi.mock('../../../../src/app/pieces/metadata/piece-metadata-service', () => ({
    getPiecePackageWithoutArchive: vi.fn(),
}))

const { actionRunService } = await import('../../../../src/app/action-run/action-run.service')
const { system } = await import('../../../../src/app/helper/system/system')
const { AppSystemProp } = await import('../../../../src/app/helper/system/system-props')

const mockLog = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as unknown as FastifyBaseLogger

const codeStep: CodeAction = {
    name: 'step_1',
    type: FlowActionType.CODE,
    valid: true,
    displayName: 'Code',
    lastUpdatedDate: new Date(0).toISOString(),
    settings: {
        sourceCode: { packageJson: '{}', code: 'export const code = async () => 1' },
        input: {},
    },
}

async function runAndReadBudgetMs(): Promise<number> {
    const startedAt = Date.now()
    await actionRunService(mockLog).run({ projectId: 'proj-1', platformId: 'plat-1', step: codeStep })
    const [request] = submitAndWaitForResponse.mock.calls[0]
    return request.expiresAt - startedAt
}

describe('action run budget', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        submitAndWaitForResponse.mockReset()
        submitAndWaitForResponse.mockResolvedValue({ success: true, output: 1, status: FlowRunStatus.SUCCEEDED })
    })

    it('gives an action run the same budget a flow run gets', async () => {
        vi.spyOn(system, 'getNumberOrThrow').mockImplementation(prop => prop === AppSystemProp.FLOW_TIMEOUT_SECONDS ? 600 : 0)

        expect(await runAndReadBudgetMs()).toBeGreaterThanOrEqual(600_000)
    })

    it('follows AP_FLOW_TIMEOUT_SECONDS when a self-hoster raises it, which is what unblocks a tool that runs longer than the old fixed 120s', async () => {
        vi.spyOn(system, 'getNumberOrThrow').mockImplementation(prop => prop === AppSystemProp.FLOW_TIMEOUT_SECONDS ? 1_800 : 0)

        expect(await runAndReadBudgetMs()).toBeGreaterThanOrEqual(1_800_000)
    })
})
