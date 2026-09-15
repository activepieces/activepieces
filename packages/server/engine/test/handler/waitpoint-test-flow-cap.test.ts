import { FlowRunStatus, StreamStepProgress } from '@activepieces/shared'
import dayjs from 'dayjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockCreate, mockGetPieceAndAction, mockRunProgress } = vi.hoisted(() => ({
    mockCreate: vi.fn().mockResolvedValue({ id: 'waitpoint-id', resumeUrl: 'http://localhost/resume' }),
    mockGetPieceAndAction: vi.fn(),
    mockRunProgress: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/lib/api/engine-run-api', () => ({
    engineRunApi: {
        updateRunProgress: mockRunProgress,
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

// Nothing listens here. A progress call that escapes the mock fails loudly in this suite
// instead of quietly succeeding against whatever dev server the author happens to be running.
const UNREACHABLE_API_URL = 'http://127.0.0.1:1/'

const THREE_HOURS_MS = 3 * 60 * 60 * 1_000
const FIFTEEN_MINUTES_MS = 15 * 60 * 1_000

function pieceThatWaits({ maxTestWaitMs }: { maxTestWaitMs?: number }) {
    return {
        piece: { auth: undefined },
        pieceAction: {
            name: 'wait_for_something',
            props: {},
            requireAuth: false,
            run: async (context: { run: { createWaitpoint: (p: unknown) => Promise<unknown>, waitForWaitpoint: (id: string) => void } }) => {
                await context.run.createWaitpoint({
                    type: 'WEBHOOK',
                    resumeDateTime: new Date(Date.now() + THREE_HOURS_MS).toUTCString(),
                    ...(maxTestWaitMs === undefined ? {} : { maxTestWaitMs }),
                })
                context.run.waitForWaitpoint('waitpoint-id')
                return {}
            },
        },
    }
}

async function runWaitingStep({ maxTestWaitMs, streamStepProgress }: { maxTestWaitMs?: number, streamStepProgress: StreamStepProgress }): Promise<{ resumeDateTime?: string }> {
    mockGetPieceAndAction.mockResolvedValue(pieceThatWaits({ maxTestWaitMs }))
    const action = buildPieceAction({
        name: 'waiter',
        pieceName: '@activepieces/piece-under-test',
        actionName: 'wait_for_something',
        input: {},
    })
    const result = await flowExecutor.execute({
        action,
        executionState: FlowExecutorContext.empty(),
        constants: generateMockEngineConstants({ streamStepProgress, internalApiUrl: UNREACHABLE_API_URL }),
    })
    expect(result.verdict, JSON.stringify(result.steps?.waiter?.errorMessage ?? null)).not.toBe(FlowRunStatus.FAILED)
    expect(mockCreate).toHaveBeenCalledTimes(1)
    return mockCreate.mock.calls[0][0] as { resumeDateTime?: string }
}

describe('a step that asks to wait longer than a person will sit through', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockCreate.mockResolvedValue({ id: 'waitpoint-id', resumeUrl: 'http://localhost/resume' })
    })

    it('gets the shorter deadline it asked for when someone is watching the builder', async () => {
        const sent = await runWaitingStep({ maxTestWaitMs: FIFTEEN_MINUTES_MS, streamStepProgress: StreamStepProgress.WEBSOCKET })

        expect(dayjs(sent.resumeDateTime).diff(dayjs(), 'minute')).toBeLessThanOrEqual(15)
    })

    it('reports run progress through the mocked api, so the suite needs nothing listening on port 3000', async () => {
        await runWaitingStep({ maxTestWaitMs: FIFTEEN_MINUTES_MS, streamStepProgress: StreamStepProgress.WEBSOCKET })

        expect(mockRunProgress).toHaveBeenCalled()
    })

    it('keeps the full deadline when the flow runs unattended', async () => {
        const sent = await runWaitingStep({ maxTestWaitMs: FIFTEEN_MINUTES_MS, streamStepProgress: StreamStepProgress.NONE })

        expect(dayjs(sent.resumeDateTime).diff(dayjs(), 'minute')).toBeGreaterThan(150)
    })

    it('leaves a step that never asked for a shorter test wait exactly as it was', async () => {
        const sent = await runWaitingStep({ streamStepProgress: StreamStepProgress.WEBSOCKET })

        expect(dayjs(sent.resumeDateTime).diff(dayjs(), 'minute')).toBeGreaterThan(150)
    })
})
