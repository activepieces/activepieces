import { Action, ActionType, ExecuteFlowOperation, ExecutionType, FlowRerunStrategy, StepOutputStatus, isNil } from '@activepieces/shared'
import { codeExecutor } from './code-executor'
import { ExecutionVerdict, FlowExecutorContext } from './context/flow-execution-context'
import { branchExecutor } from './branch-executor'
import { BaseExecutor } from './base-executor'
import { loopExecutor } from './loop-executor'
import { pieceExecutor } from './piece-executor'
import { EngineConstantData } from './context/engine-constants-data'

const executeFunction: Record<ActionType, BaseExecutor<Action>> = {
    [ActionType.CODE]: codeExecutor,
    [ActionType.BRANCH]: branchExecutor,
    [ActionType.LOOP_ON_ITEMS]: loopExecutor,
    [ActionType.PIECE]: pieceExecutor,
}

export const flowExecutor = {
    getExecutorForAction(type: ActionType): BaseExecutor<Action> {
        const executor = executeFunction[type]
        if (isNil(executor)) {
            throw new Error('Not implemented')
        }
        return executor
    },
    getStartAction(input: ExecuteFlowOperation): Action {
        let startAction: Action | undefined

        switch (input.executionType) {
            case ExecutionType.RERUN:
                const { strategy } = input.rerunPayload

                switch (strategy) {
                    case FlowRerunStrategy.FROM_FAILED: {
                        let failedStep: string | undefined
                        for (const stepName in input.executionState.steps) {
                            const step = input.executionState.steps[stepName]
                            if (step.status === StepOutputStatus.FAILED) {
                                failedStep = stepName
                                break
                            }
                        }

                        for (let action: Action | undefined = input.flowVersion.trigger.nextAction; action;) {
                            if (action.name === failedStep) {
                                startAction = action
                                break
                            }

                            if (action.nextAction && ('firstLoopAction' in action.nextAction || 'onSuccessAction' in action.nextAction)) {
                                startAction = action
                                break
                            }
                            else {
                                action = action.nextAction
                            }
                        }
                        break
                    }
                    case FlowRerunStrategy.FLOW:
                    default:
                        startAction = input.flowVersion.trigger.nextAction
                }
                break
            case ExecutionType.BEGIN:
            case ExecutionType.RESUME:
            default:
                startAction = input.flowVersion.trigger.nextAction
        }
        if (isNil(startAction)) {
            throw new Error(`No start action found for flow execution for run ${input.flowRunId}`)
        }

        return startAction
    },
    async execute({ action, constants, executionState }: {
        action: Action
        executionState: FlowExecutorContext
        constants: EngineConstantData
    }): Promise<FlowExecutorContext> {
        const startTime = new Date().getMilliseconds()
        let flowExecutionContext = executionState
        let currentAction: Action | undefined = action
        while (!isNil(currentAction)) {
            const handler = this.getExecutorForAction(currentAction.type)
            flowExecutionContext = await handler.handle({
                action: currentAction,
                executionState: flowExecutionContext,
                constants,
            })
            if (flowExecutionContext.verdict !== ExecutionVerdict.RUNNING) {
                return flowExecutionContext
            }
            currentAction = currentAction.nextAction
        }
        return flowExecutionContext.setDuration(new Date().getMilliseconds() - startTime)
    },
}
