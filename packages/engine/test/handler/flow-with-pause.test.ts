import { BranchOperator, ExecutionOutputStatus, ExecutionType, LoopStepOutput } from '@activepieces/shared'
import { ExecutionVerdict, FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
import { flowExecutor } from '../../src/lib/handler/flow-executor'
import { buildActionWithOneCondition, buildCodeAction, buildPieceAction, buildSimpleLoopAction, generateMockEngineConstants } from './test-helper'
import { StepExecutionPath } from '../../src/lib/handler/context/step-execution-path'


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

const pauseFlowWithLoopAndBranch = buildSimpleLoopAction({
    name: 'loop',
    loopItems: '{{ [1] }}',
    firstLoopAction: buildActionWithOneCondition({
        condition: {
            operator: BranchOperator.BOOLEAN_IS_FALSE,
            firstValue: '{{ false }}',
        },
        onSuccessAction: simplePauseFlow,
    }),


})
describe('flow with pause', () => {

    it('should pause and resume succesfully with loops and branch', async () => {
        const pauseResult = await flowExecutor.execute({
            action: pauseFlowWithLoopAndBranch,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })
        expect(pauseResult.verdict).toBe(ExecutionVerdict.PAUSED)
        expect(pauseResult.verdictResponse).toEqual({
            'pauseMetadata': {
                'actions': ['approve', 'disapprove'],
                'type': 'WEBHOOK',
            },
            'reason': ExecutionOutputStatus.PAUSED,
        })
        expect(Object.keys(pauseResult.steps)).toEqual(['loop'])

        const resumeResult = await flowExecutor.execute({
            action: pauseFlowWithLoopAndBranch,
            executionState: pauseResult.setCurrentPath(StepExecutionPath.empty()),
            constants: generateMockEngineConstants({
                resumePayload: {
                    action: 'approve',
                },
                executionType: ExecutionType.RESUME,
            }),
        })
        expect(resumeResult.verdict).toBe(ExecutionVerdict.RUNNING)
        expect(Object.keys(resumeResult.steps)).toEqual(['loop'])
        const loopOut = resumeResult.steps.loop as LoopStepOutput
        expect(Object.keys(loopOut.output?.iterations[0] ?? {})).toEqual(['branch', 'approval', 'echo_step'])
    })

    it('should pause and resume successfully', async () => {
        const pauseResult = await flowExecutor.execute({
            action: simplePauseFlow,
            executionState: FlowExecutorContext.empty(),
            constants: generateMockEngineConstants(),
        })
        expect(pauseResult.verdict).toBe(ExecutionVerdict.PAUSED)
        expect(pauseResult.verdictResponse).toEqual({
            'pauseMetadata': {
                'actions': ['approve', 'disapprove'],
                'type': 'WEBHOOK',
            },
            'reason': ExecutionOutputStatus.PAUSED,
        })
        expect(Object.keys(pauseResult.currentState).length).toBe(1)

        const resumeResult = await flowExecutor.execute({
            action: simplePauseFlow,
            executionState: pauseResult,
            constants: generateMockEngineConstants({
                resumePayload: {
                    action: 'approve',
                },
                executionType: ExecutionType.RESUME,
            }),
        })
        expect(resumeResult.verdict).toBe(ExecutionVerdict.RUNNING)
        expect(resumeResult.currentState).toEqual({
            'approval': {
                approved: true,
            },
            echo_step: {},
        })
    })

})
