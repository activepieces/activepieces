import { FlowRunStatus, StreamStepProgress } from '@activepieces/shared'
import { describe, expect, it, vi } from 'vitest'

const INSTANCE_RESUME_URL = 'https://cloud.activepieces.com/api/v1/flow-runs/run-1/waitpoints/wp-1'
const PUBLIC_RESUME_URL = 'https://embed.example.com/api/v1/flow-runs/run-1/waitpoints/wp-1'

const { mockCreate, mockGetPieceAndAction } = vi.hoisted(() => ({
    mockCreate: vi.fn(),
    mockGetPieceAndAction: vi.fn(),
}))

vi.mock('../../src/lib/api/engine-run-api', () => ({
    engineRunApi: {
        updateRunProgress: vi.fn().mockResolvedValue(undefined),
        updateStepProgress: vi.fn(),
        uploadRunLog: vi.fn(),
        sendFlowResponse: vi.fn(),
    },
}))

vi.mock('../../src/lib/piece-context/waitpoint-client', () => ({
    waitpointClient: { create: mockCreate },
}))

vi.mock('../../src/lib/helper/piece-loader', () => ({
    pieceLoader: {
        getPieceAndActionOrThrow: mockGetPieceAndAction,
        loadPieceOrThrow: vi.fn(),
        getPackageAlias: vi.fn(),
        getPiecePath: vi.fn(),
        getPropOrThrow: vi.fn(),
    },
}))

import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildPieceAction, generateMockEngineConstants } from './test-helper'

describe('waitpoint links handed to a piece', () => {
    it('keeps resumeUrl and buildResumeUrl on the instance while passing publicResumeUrl through', async () => {
        mockCreate.mockResolvedValue({ id: 'wp-1', resumeUrl: INSTANCE_RESUME_URL, publicResumeUrl: PUBLIC_RESUME_URL })
        mockGetPieceAndAction.mockResolvedValue(pieceThatReportsItsLinks())

        const output = await runStep()

        expect(output).toEqual({
            resumeUrl: INSTANCE_RESUME_URL,
            publicResumeUrl: PUBLIC_RESUME_URL,
            builtResumeUrl: `${INSTANCE_RESUME_URL}?action=approve`,
            builtSyncResumeUrl: `${INSTANCE_RESUME_URL}/sync?action=approve`,
        })
    })

    it('leaves publicResumeUrl undefined when the server sends none', async () => {
        mockCreate.mockResolvedValue({ id: 'wp-1', resumeUrl: INSTANCE_RESUME_URL })
        mockGetPieceAndAction.mockResolvedValue(pieceThatReportsItsLinks())

        const output = await runStep()

        expect(output).toEqual({
            resumeUrl: INSTANCE_RESUME_URL,
            builtResumeUrl: `${INSTANCE_RESUME_URL}?action=approve`,
            builtSyncResumeUrl: `${INSTANCE_RESUME_URL}/sync?action=approve`,
        })
    })
})

function pieceThatReportsItsLinks() {
    return {
        piece: { auth: undefined },
        pieceAction: {
            name: 'report_links',
            props: {},
            requireAuth: false,
            run: async (context: { run: { createWaitpoint: (p: unknown) => Promise<ReportedWaitpoint> } }) => {
                const waitpoint = await context.run.createWaitpoint({ type: 'WEBHOOK' })
                return {
                    resumeUrl: waitpoint.resumeUrl,
                    publicResumeUrl: waitpoint.publicResumeUrl,
                    builtResumeUrl: waitpoint.buildResumeUrl({ queryParams: { action: 'approve' } }),
                    builtSyncResumeUrl: waitpoint.buildResumeUrl({ queryParams: { action: 'approve' }, sync: true }),
                }
            },
        },
    }
}

async function runStep(): Promise<unknown> {
    const result = await flowExecutor.execute({
        action: buildPieceAction({ name: 'reporter', pieceName: '@activepieces/piece-under-test', actionName: 'report_links', input: {} }),
        executionState: FlowExecutorContext.empty(),
        constants: generateMockEngineConstants({ streamStepProgress: StreamStepProgress.NONE, internalApiUrl: 'http://127.0.0.1:1/' }),
    })
    expect(result.verdict, JSON.stringify(result.steps?.reporter?.errorMessage ?? null)).not.toBe(FlowRunStatus.FAILED)
    return result.steps.reporter.output
}

type ReportedWaitpoint = {
    resumeUrl: string
    publicResumeUrl?: string
    buildResumeUrl: (params: { queryParams: Record<string, string>, sync?: boolean }) => string
}
