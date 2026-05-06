import { describe, expect, it, vi } from 'vitest'
import {
    AgentToolType,
    FlowVersionState,
    RunEnvironment,
    StepOutputStatus,
    StreamStepProgress,
} from '@activepieces/shared'
import { EngineConstants } from '../../src/lib/handler/context/engine-constants'
import { agentTools } from '../../src/lib/tools'

const captured = vi.hoisted(() => ({
    constants: undefined as EngineConstants | undefined,
}))

vi.mock('../../src/lib/helper/piece-loader', () => ({
    pieceLoader: {
        getPieceAndActionOrThrow: vi.fn().mockResolvedValue({
            pieceAction: {
                description: 'Test tool action',
                props: {},
            },
        }),
    },
}))

vi.mock('../../src/lib/handler/flow-executor', () => ({
    flowExecutor: {
        getExecutorForAction: vi.fn().mockReturnValue({
            handle: vi.fn().mockImplementation(async ({ constants }) => {
                captured.constants = constants
                return {
                    steps: {
                        test_action: {
                            status: StepOutputStatus.SUCCEEDED,
                            output: { ok: true },
                        },
                    },
                }
            }),
        }),
    },
}))

function makeEngineConstants(): EngineConstants {
    return new EngineConstants({
        flowId: 'flow-real',
        flowVersionId: 'flow-version-real',
        flowVersionState: FlowVersionState.LOCKED,
        triggerPieceName: 'trigger',
        flowRunId: 'flow-run-real',
        publicApiUrl: 'https://app.example.com/api/',
        internalApiUrl: 'http://server:3000/',
        retryConstants: {
            maxAttempts: 4,
            retryExponential: 2,
            retryInterval: 2000,
        },
        engineToken: 'engine-token',
        projectId: 'project-id',
        streamStepProgress: StreamStepProgress.NONE,
        workerHandlerId: 'worker-id',
        httpRequestId: 'request-id',
        runEnvironment: RunEnvironment.PRODUCTION,
        timeoutInSeconds: 600,
        platformId: 'platform-id',
        stepNames: ['trigger', 'agent'],
    })
}

describe('agentTools', () => {
    it('runs nested piece tools with the parent flow constants', async () => {
        const parentConstants = makeEngineConstants()
        const tools = await agentTools.tools({
            engineConstants: parentConstants,
            model: {} as never,
            tools: [
                {
                    toolName: 'test_tool',
                    type: AgentToolType.PIECE,
                    pieceMetadata: {
                        pieceName: '@activepieces/piece-test',
                        pieceVersion: '1.0.0',
                        actionName: 'test_action',
                        predefinedInput: { fields: {} },
                    },
                },
            ],
        })

        await tools.test_tool.execute?.(
            { instruction: 'run the nested action' },
            { toolCallId: 'call-1', messages: [] },
        )

        expect(captured.constants?.flowId).toBe('flow-real')
        expect(captured.constants?.flowRunId).toBe('flow-run-real')
        expect(captured.constants?.flowVersionId).toBe('flow-version-real')
        expect(captured.constants?.stepNames).toEqual(['trigger', 'agent'])
    })
})
