import { BranchOperator, FlowRunStatus, LoopStepOutput, RouterExecutionType, RouterStepOutput } from '@activepieces/shared'
import { FlowExecutorContext } from '../../src/lib/handler/context/flow-execution-context'
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
    loopItems: '{{ [false, true ] }}',
    firstLoopAction: buildRouterWithOneCondition({
        conditions: [
            {
                operator: BranchOperator.BOOLEAN_IS_TRUE,
                firstValue: '{{ loop.item }}',
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
        expect(pauseResult.verdict).toEqual({
            status: FlowRunStatus.PAUSED,
            pauseMetadata: {
                response: {},
                requestId: 'requestId',
                requestIdToReply: undefined,
                'type': 'WEBHOOK',
            },
        })
        expect(Object.keys(pauseResult.steps)).toEqual(['loop'])

        // Verify that the first iteration (true) triggered the branch condition
        const loopOutputBeforeResume = pauseResult.steps.loop as LoopStepOutput
        expect(loopOutputBeforeResume.output?.iterations.length).toBe(2)
        expect(loopOutputBeforeResume.output?.item).toBe(true)
        expect(Object.keys(loopOutputBeforeResume.output?.iterations[0] ?? {})).toContain('router')
        

        const resumeResultTwo = await flowExecutor.execute({
            action: pauseFlowWithLoopAndBranch,
            executionState: pauseResult.setCurrentPath(StepExecutionPath.empty()).setVerdict({
                status: FlowRunStatus.RUNNING,
            }),
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
        
        expect(resumeResultTwo.verdict).toStrictEqual({
            status: FlowRunStatus.RUNNING,
        },
        )
        expect(Object.keys(resumeResultTwo.steps)).toEqual(['loop'])
        
        const loopOut = resumeResultTwo.steps.loop as LoopStepOutput
        expect(Object.keys(loopOut.output?.iterations[1] ?? {})).toEqual(['router', 'approval', 'echo_step'])
        expect((loopOut.output?.iterations[0].router as RouterStepOutput).output?.branches[0].evaluation).toBe(false)
        expect((loopOut.output?.iterations[1].router as RouterStepOutput).output?.branches[0].evaluation).toBe(true)
        

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
        expect(resumeResult1.verdict).toStrictEqual({
            status: FlowRunStatus.PAUSED,
            pauseMetadata: {
                response: {},
                requestId: 'requestId',
                requestIdToReply: undefined,
                'type': 'WEBHOOK',
            },
        })
        const resumeResult2 = await flowExecutor.execute({
            action: flawWithTwoPause,
            executionState: resumeResult1.setVerdict({
                status: FlowRunStatus.RUNNING,
            }),
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
        expect(resumeResult2.verdict).toStrictEqual({
            status: FlowRunStatus.RUNNING,
        })

    })


    it('should pause and resume successfully', async () => {
        const pauseResult = await flowExecutor.execute({
            action: simplePauseFlow,
            executionState: FlowExecutorContext.empty().setPauseRequestId('requestId'),
            constants: generateMockEngineConstants(),
        })
        expect(pauseResult.verdict).toStrictEqual({
            status: FlowRunStatus.PAUSED,
            pauseMetadata: {
                response: {},
                requestId: 'requestId',
                requestIdToReply: undefined,
                'type': 'WEBHOOK',
            },
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
        expect(resumeResult.verdict).toStrictEqual({
            status: FlowRunStatus.RUNNING,
        })
        expect(resumeResult.currentState()).toEqual({
            'approval': {
                approved: true,
            },
            echo_step: {},
        })
    })

    it('should pause at most one action when router has multiple branches with pause actions', async () => {
        const routerWithTwoPauseActions = buildRouterWithOneCondition({
            conditions: [
                {
                    operator: BranchOperator.BOOLEAN_IS_TRUE,
                    firstValue: 'true',
                },
                {
                    operator: BranchOperator.BOOLEAN_IS_TRUE,
                    firstValue: 'true',
                },
            ],
            executionType: RouterExecutionType.EXECUTE_ALL_MATCH,
            children: [
                buildPieceAction({
                    name: 'approval_1',
                    pieceName: '@activepieces/piece-approval',
                    actionName: 'wait_for_approval',
                    input: {},
                    nextAction: buildCodeAction({
                        name: 'echo_step',
                        input: {},
                    }),
                }),
                buildPieceAction({
                    name: 'approval_2',
                    pieceName: '@activepieces/piece-approval',
                    actionName: 'wait_for_approval',
                    input: {},
                    nextAction: buildCodeAction({
                        name: 'echo_step_1',
                        input: {},
                    }),
                }),
            ],
        })

        const result = await flowExecutor.execute({
            action: routerWithTwoPauseActions,
            executionState: FlowExecutorContext.empty().setPauseRequestId('requestId'),
            constants: generateMockEngineConstants(),
        })

        expect(result.verdict).toStrictEqual({
            status: FlowRunStatus.PAUSED,
            pauseMetadata: {
                response: {},
                requestId: 'requestId',
                requestIdToReply: undefined,
                'type': 'WEBHOOK',
            },
        })

        const routerOutput = result.steps.router as RouterStepOutput
        expect(routerOutput).toBeDefined()
        expect(routerOutput.output).toBeDefined()
        
        const executedBranches = routerOutput.output?.branches?.filter((branch) => branch.evaluation === true)
        expect(executedBranches).toHaveLength(2)
        
        expect(result.steps.approval_1).toBeDefined()
        expect(result.steps.approval_1.status).toBe('PAUSED')
        expect(result.steps.approval_2).toBeUndefined()
        
        expect(Object.keys(result.steps)).toEqual(['router', 'approval_1'])
    })

})
