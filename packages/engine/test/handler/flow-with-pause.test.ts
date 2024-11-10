import { BranchOperator, LoopStepOutput, RouterExecutionType } from '@activepieces/shared'
import { ExecutionVerdict, FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { StepExecutionPath } from '../../src/lib/handler/context/step-execution-path'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildCodeAction, buildPieceAction, buildRouterWithOneCondition, buildSimpleLoopAction, generateMockEngineConstants } from './test-helper'


const simplePauseFlow = buildPieceAction({
    name: 'approval',
    pieceName: '@activepieces/piece-approval',
    actionName: 'wait_for_approval',
    input: {},
    nextAction: buildCodeAction({
        name: 'echo_step',
        input: {},
    }),
})

const flawWithTwoPause = buildPieceAction({
    name: 'approval',
    pieceName: '@activepieces/piece-approval',
    actionName: 'wait_for_approval',
    input: {},
    nextAction: buildCodeAction({
        name: 'echo_step',
        input: {},
        nextAction: buildPieceAction({
            name: 'approval-1',
            pieceName: '@activepieces/piece-approval',
            actionName: 'wait_for_approval',
            input: {},
            nextAction: buildCodeAction({
                name: 'echo_step_1',
                input: {},
            }),
        }),

    }),
})


const pauseFlowWithLoopAndBranch = buildSimpleLoopAction({
    name: 'loop',
    loopItems: '{{ [1] }}',
    firstLoopAction: buildRouterWithOneCondition({
        conditions: [
            {
                operator: BranchOperator.BOOLEAN_IS_FALSE,
                firstValue: '{{ false }}',
            },
        ],
        executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
        children: [
            simplePauseFlow,
        ],
    }),


})
describe('flow with pause', () => {

    it('should pause and resume successfully with loops and branch', async () => {
        const pauseResult = await flowExecutor.execute({
            action: pauseFlowWithLoopAndBranch,
            executionState: FlowExecutorContext.empty().setPauseRequestId('requestId'),
            constants: generateMockEngineConstants(),
        })
        expect(pauseResult.verdict).toBe(ExecutionVerdict.PAUSED)
        expect(pauseResult.verdictResponse).toEqual({
            'pauseMetadata': {
                response: {},
                requestId: 'requestId',
                'type': 'WEBHOOK',
            },
            'reason': 'PAUSED',
        })
        expect(Object.keys(pauseResult.steps)).toEqual(['loop'])

        const resumeResult = await flowExecutor.execute({
            action: pauseFlowWithLoopAndBranch,
            executionState: pauseResult.setCurrentPath(StepExecutionPath.empty()),
            constants: generateMockEngineConstants({
                resumePayload: {
                    queryParams: {
                        action: 'approve',
                    },
                    body: {},
                    headers: {},
                },
            }),
        })
        expect(resumeResult.verdict).toBe(ExecutionVerdict.RUNNING)
        expect(Object.keys(resumeResult.steps)).toEqual(['loop'])
        const loopOut = resumeResult.steps.loop as LoopStepOutput
        expect(Object.keys(loopOut.output?.iterations[0] ?? {})).toEqual(['router', 'approval', 'echo_step'])
    })

    it('should pause and resume with two different steps in same flow successfully', async () => {
        const pauseResult1 = await flowExecutor.execute({
            action: flawWithTwoPause,
            executionState: FlowExecutorContext.empty().setPauseRequestId('requestId'),
            constants: generateMockEngineConstants(),
        })
        const resumeResult1 = await flowExecutor.execute({
            action: flawWithTwoPause,
            executionState: pauseResult1,
            constants: generateMockEngineConstants({
                resumePayload: {
                    queryParams: {
                        action: 'approve',
                    },
                    body: {},
                    headers: {},
                },
            }),
        })
        expect(resumeResult1.verdict).toBe(ExecutionVerdict.PAUSED)
        expect(resumeResult1.verdictResponse).toEqual({
            'pauseMetadata': {
                response: {},
                requestId: 'requestId',
                'type': 'WEBHOOK',
            },
            'reason': 'PAUSED',
        })
        const resumeResult2 = await flowExecutor.execute({
            action: flawWithTwoPause,
            executionState: resumeResult1.setVerdict(ExecutionVerdict.RUNNING, undefined),
            constants: generateMockEngineConstants({
                resumePayload: {
                    queryParams: {
                        action: 'approve',
                    },
                    body: {},
                    headers: {},
                },
            }),
        })
        expect(resumeResult2.verdict).toBe(ExecutionVerdict.RUNNING)

    })


    it('should pause and resume successfully', async () => {
        const pauseResult = await flowExecutor.execute({
            action: simplePauseFlow,
            executionState: FlowExecutorContext.empty().setPauseRequestId('requestId'),
            constants: generateMockEngineConstants(),
        })
        expect(pauseResult.verdict).toBe(ExecutionVerdict.PAUSED)
        expect(pauseResult.verdictResponse).toEqual({
            'pauseMetadata': {
                response: {},
                requestId: 'requestId',
                'type': 'WEBHOOK',
            },
            'reason': 'PAUSED',
        })
        const currentState = pauseResult.currentState()
        expect(Object.keys(currentState).length).toBe(1)

        const resumeResult = await flowExecutor.execute({
            action: simplePauseFlow,
            executionState: pauseResult,
            constants: generateMockEngineConstants({
                resumePayload: {
                    queryParams: {
                        action: 'approve',
                    },
                    body: {},
                    headers: {},
                },
            }),
        })
        expect(resumeResult.verdict).toBe(ExecutionVerdict.RUNNING)
        expect(resumeResult.currentState()).toEqual({
            'approval': {
                approved: true,
            },
            echo_step: {},
        })
    })

})
