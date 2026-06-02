import { FlowAction, FlowRunStatus, StepOutputStatus, StreamStepProgress, UpdateRunProgressRequest } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { buildPieceAction, generateMockEngineConstants } from './test-helper'

const { updateRunProgressMock } = vi.hoisted(() => ({
    updateRunProgressMock: vi.fn<(request: UpdateRunProgressRequest) => Promise<void>>().mockResolvedValue(undefined),
}))

vi.mock('../../src/lib/worker-socket', () => ({
    workerSocket: {
        getWorkerClient: () => ({
            updateRunProgress: updateRunProgressMock,
            updateStepProgress: vi.fn(),
            uploadRunLog: vi.fn(),
            sendFlowResponse: vi.fn(),
        }),
    },
}))

import { flowExecutor } from '../../src/lib/handler/flow-executor'

describe('flowExecutor — progress events with skipped neighbours', () => {
    beforeEach(() => {
        updateRunProgressMock.mockClear()
    })

    it('streams SUCCEEDED for the step preceding skipped steps before the next executed step runs', async () => {
        const flow = buildMapper({
            name: 'first',
            mapping: { key: '{{ 1 + 2 }}' },
            nextAction: buildMapper({
                name: 'skipped_a',
                skip: true,
                nextAction: buildMapper({
                    name: 'skipped_b',
                    skip: true,
                    nextAction: buildMapper({
                        name: 'second',
                        mapping: { doubled: '{{ 2 + 2 }}' },
                    }),
                }),
            }),
        })

        const result = await flowExecutor.execute({
            action: flow,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ streamStepProgress: StreamStepProgress.WEBSOCKET }),
        })

        expect(result.verdict).toStrictEqual({ status: FlowRunStatus.RUNNING })

        const finalStatus = lastStatusByStep()
        expect(finalStatus.first).toBe(StepOutputStatus.SUCCEEDED)
        expect(finalStatus.second).toBe(StepOutputStatus.SUCCEEDED)
    })

    it('streams SUCCEEDED for the last executed step even when it is followed by skipped steps', async () => {
        const flow = buildMapper({
            name: 'only',
            mapping: { key: '{{ 7 + 3 }}' },
            nextAction: buildMapper({ name: 'trailing_skip', skip: true }),
        })

        await flowExecutor.execute({
            action: flow,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants({ streamStepProgress: StreamStepProgress.WEBSOCKET }),
        })

        expect(lastStatusByStep().only).toBe(StepOutputStatus.SUCCEEDED)
    })
})

const lastStatusByStep = (): Record<string, StepOutputStatus> => {
    const result: Record<string, StepOutputStatus> = {}
    for (const [request] of updateRunProgressMock.mock.calls) {
        if (request.step) {
            result[request.step.name] = request.step.output.status
        }
    }
    return result
}

const buildMapper = ({ name, mapping, skip, nextAction }: {
    name: string
    mapping?: Record<string, unknown>
    skip?: boolean
    nextAction?: FlowAction
}): FlowAction => ({
    ...buildPieceAction({
        name,
        input: { mapping: mapping ?? {} },
        skip,
        pieceName: '@activepieces/piece-data-mapper',
        actionName: 'advanced_mapping',
    }),
    nextAction,
})
